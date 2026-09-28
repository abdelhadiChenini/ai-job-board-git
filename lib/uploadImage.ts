export type UploadedImage = {
  url: string;
  secure_url: string;
  publicId: string;
  width: number;
  height: number;
};

export async function uploadImage(
  file: File,
  folder: string,
): Promise<UploadedImage> {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  const response = await fetch("/api/upload", {
    method: "POST",
    body,
  });

  let data: (UploadedImage & { error?: string }) | null = null;
  try {
    data = (await response.json()) as UploadedImage & { error?: string };
  } catch {
    data = null;
  }

  if (!response.ok || !data?.url) {
    throw new Error(data?.error || "Could not upload the image.");
  }

  return data;
}
