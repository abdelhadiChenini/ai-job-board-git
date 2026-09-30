import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Writable } from "node:stream";

/**
 * Exercises the upload route against a fake Cloudinary client, so the pipeline
 * (magic-byte gate, chunked stream, error mapping) is covered without network
 * access or real credentials.
 */

const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

type Captured = { options: Record<string, unknown>; received: Buffer };

const state = {
  captured: [] as Captured[],
  failure: null as { message?: string; http_code?: number } | null,
  result: {
    secure_url: "https://res.cloudinary.com/demo/image/upload/pic.jpg",
    public_id: "profile-pictures/pic",
    width: 1,
    height: 1,
  } as Record<string, unknown>,
  configured: 0,
  logged: [] as unknown[][],
};

vi.mock("cloudinary", () => ({
  v2: {
    config: () => {
      state.configured += 1;
    },
    uploader: {
      upload_stream: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: unknown) => void,
      ) => {
        const chunks: Buffer[] = [];
        return new Writable({
          write(chunk, _encoding, next) {
            chunks.push(Buffer.from(chunk));
            next();
          },
          final(next) {
            state.captured.push({
              options,
              received: Buffer.concat(chunks),
            });
            callback(state.failure, state.failure ? undefined : state.result);
            next();
          },
        });
      },
    },
  },
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  state.captured = [];
  state.failure = null;
  state.configured = 0;
  state.logged = [];
  process.env.CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "secret";
  vi.spyOn(console, "error").mockImplementation((...args) => {
    state.logged.push(args);
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

function post(file: File, folder = "profile-pictures") {
  return import("@/app/api/upload/route").then(({ POST }) => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    return POST(
      new Request("https://example.com/api/upload", { method: "POST", body: form }),
    );
  });
}

describe("upload pipeline", () => {
  it("uploads a real PNG and returns the secure URL", async () => {
    const response = await post(new File([PNG_1x1], "avatar.png", { type: "image/png" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe("https://res.cloudinary.com/demo/image/upload/pic.jpg");
    expect(body.secure_url).toBe(body.url);
    expect(body.publicId).toBe("profile-pictures/pic");
  });

  it("delivers the complete file to Cloudinary unmodified", async () => {
    // Guards the whole read-to-stream path: a truncated or re-encoded buffer
    // would produce a corrupt upload that Cloudinary reports as an opaque
    // format error.
    const large = Buffer.concat([PNG_1x1, Buffer.alloc(200_000, 0x41)]);

    await post(new File([large], "big.png", { type: "image/png" }));

    expect(state.captured).toHaveLength(1);
    expect(state.captured[0].received.length).toBe(large.length);
    expect(state.captured[0].received.equals(large)).toBe(true);
  });

  it("rejects a non-image disguised with an image content-type", async () => {
    // The pre-auth registration flow means anyone can reach this endpoint.
    const exe = Buffer.from("MZ\0\0this is not an image", "binary");

    const response = await post(new File([exe], "payload.png", { type: "image/png" }));

    expect(response.status).toBe(415);
    expect(state.captured).toHaveLength(0);
  });

  it("accepts every format it advertises", async () => {
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.alloc(64),
    ]);
    const gif = Buffer.from("GIF89a" + "x".repeat(64), "ascii");
    const webp = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.alloc(4),
      Buffer.from("WEBP", "ascii"),
      Buffer.alloc(64),
    ]);
    const avif = Buffer.concat([
      Buffer.alloc(4),
      Buffer.from("ftypavif", "ascii"),
      Buffer.alloc(64),
    ]);

    for (const [name, buffer, type] of [
      ["a.jpg", jpeg, "image/jpeg"],
      ["a.gif", gif, "image/gif"],
      ["a.webp", webp, "image/webp"],
      ["a.avif", avif, "image/avif"],
    ] as const) {
      const response = await post(new File([buffer], name, { type }));
      expect(response.status).toBe(200);
    }
  });

  it("rejects a declared type that is not on the allowlist", async () => {
    const response = await post(
      new File([PNG_1x1], "a.svg", { type: "image/svg+xml" }),
    );

    expect(response.status).toBe(415);
    expect(state.captured).toHaveLength(0);
  });

  it("strips the extension and odd characters from the override name", async () => {
    await post(
      new File([PNG_1x1], "../../etc/pass wd.png", { type: "image/png" }),
      "profile-pictures",
    );

    expect(state.captured[0].options.filename_override).toBe("etc-pass-wd");
    expect(state.captured[0].options.folder).toBe("profile-pictures");
  });
});

describe("upload error reporting", () => {
  it("turns a Cloudinary 401 into a misconfiguration message", async () => {
    // This is the failure that produced the useless "Please try again": the
    // credentials are rejected and no amount of retrying will help.
    state.failure = { message: "Invalid Signature abc123.", http_code: 401 };

    const response = await post(new File([PNG_1x1], "a.png", { type: "image/png" }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toMatch(/not configured correctly/i);
  });

  it("logs the exact upstream Cloudinary message", async () => {
    state.failure = { message: "Invalid Signature deadbeef.", http_code: 401 };

    await post(new File([PNG_1x1], "a.png", { type: "image/png" }));

    const logged = JSON.stringify(state.logged);
    expect(logged).toContain("Invalid Signature deadbeef.");
    expect(logged).toContain("401");
  });

  it("never leaks the raw upstream message to the browser", async () => {
    state.failure = {
      message: "Invalid Signature deadbeef. cloud=db3tn33x3",
      http_code: 401,
    };

    const response = await post(new File([PNG_1x1], "a.png", { type: "image/png" }));
    const body = await response.json();

    expect(JSON.stringify(body)).not.toContain("db3tn33x3");
    expect(JSON.stringify(body)).not.toContain("Signature");
  });

  it("still says try again for an unexpected failure", async () => {
    state.failure = { message: "Something exploded", http_code: 500 };

    const response = await post(new File([PNG_1x1], "a.png", { type: "image/png" }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toMatch(/try again/i);
  });

  it("explains an oversized payload from Cloudinary", async () => {
    state.failure = { message: "File too large", http_code: 413 };

    const response = await post(new File([PNG_1x1], "a.png", { type: "image/png" }));
    const body = await response.json();

    expect(body.error).toMatch(/too large/i);
  });

  it("reports missing configuration without calling Cloudinary", async () => {
    delete process.env.CLOUDINARY_API_SECRET;

    const response = await post(new File([PNG_1x1], "a.png", { type: "image/png" }));

    expect(response.status).toBe(503);
    expect(state.captured).toHaveLength(0);
  });
});
