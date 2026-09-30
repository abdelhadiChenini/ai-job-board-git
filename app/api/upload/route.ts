import { NextResponse } from "next/server";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Identifies the real format from the file's magic bytes.
 *
 * The `Content-Type` on a multipart part is attacker-controlled, so trusting it
 * lets anyone push an arbitrary file onto the CDN under an image extension —
 * and this endpoint is reachable without a session, because registration
 * uploads a photo before the account exists. Sniffing the bytes closes that.
 */
function detectImageType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
      buffer.subarray(0, 6).toString("ascii") === "GIF89a")
  ) {
    return "image/gif";
  }

  // ISO base media file format: ....ftypavif
  if (
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
    buffer.subarray(8, 12).toString("ascii") === "avif"
  ) {
    return "image/avif";
  }

  return null;
}

/**
 * Keeps client-supplied strings to a safe shape before they reach Cloudinary.
 * `folder` decides where the asset lands and `filename_override` names it, and
 * neither is worth trusting verbatim.
 */
function sanitizeSegment(value: string, fallback: string): string {
  const cleaned = value
    .replace(/\.[^.]*$/, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return cleaned || fallback;
}

type CloudinaryError = {
  message?: string;
  http_code?: number;
  name?: string;
  error?: { message?: string };
};

/**
 * Turns a Cloudinary failure into a log line worth reading and a message that
 * is safe to show a user.
 *
 * The upstream message is logged in full but never returned verbatim: it can
 * carry account and API details that have no business reaching the browser.
 */
function describeUploadFailure(error: unknown) {
  const failure = (error ?? {}) as CloudinaryError;
  const upstream = failure.error?.message ?? failure.message ?? "unknown error";

  console.error("[upload] Cloudinary rejected the upload", {
    http_code: failure.http_code ?? null,
    name: failure.name ?? null,
    message: upstream,
  });

  if (failure.http_code === 401 || failure.http_code === 403) {
    // Almost always a wrong CLOUDINARY_API_SECRET or a key from a different
    // account. Retrying cannot help, so say so instead of "try again".
    return "Image service is not configured correctly. Please contact support.";
  }

  if (failure.http_code === 413) {
    return "That image is too large for Cloudinary. Please use a smaller file.";
  }

  return "Image upload failed. Please try again.";
}

export async function POST(request: Request) {
  if (!isConfigured()) {
    console.error(
      "[upload] CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET is missing",
    );
    return NextResponse.json(
      { error: "Image uploads are not configured." },
      { status: 503 },
    );
  }

  configureCloudinary();

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.error("[upload] could not parse multipart body", error);
    return NextResponse.json(
      { error: "Invalid upload request." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const folderRaw = form.get("folder");
  const folder =
    typeof folderRaw === "string" && folderRaw.trim()
      ? folderRaw.trim()
      : "uploads";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "No file was provided." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Images must be 5MB or smaller." },
      { status: 413 },
    );
  }

  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPG, PNG, WebP, GIF or AVIF." },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = detectImageType(buffer);

  if (!sniffed) {
    console.error(
      `[upload] rejected file with declared type ${file.type} but unrecognised magic bytes`,
    );
    return NextResponse.json(
      { error: "That file is not a valid image." },
      { status: 415 },
    );
  }

  if (sniffed !== file.type) {
    // Not fatal — a browser occasionally reports a generic type — but worth
    // knowing, because it is the shape a disguised file takes.
    console.warn(
      `[upload] content-type mismatch: declared ${file.type}, actual ${sniffed}`,
    );
  }

  try {
    const result = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            type: "upload",
            use_filename: true,
            filename_override: sanitizeSegment(file.name, "upload"),
            overwrite: false,
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error ?? new Error("Cloudinary returned no result."));
              return;
            }
            resolve(uploadResult);
          },
        );

        // Node's Readable.from treats a Buffer as a single chunk rather than
        // iterating its bytes, so this does not fragment a multi-megabyte file.
        Readable.from(buffer).pipe(stream);
      },
    );

    return NextResponse.json({
      url: result.secure_url,
      secure_url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    return NextResponse.json(
      { error: describeUploadFailure(error) },
      { status: 502 },
    );
  }
}
