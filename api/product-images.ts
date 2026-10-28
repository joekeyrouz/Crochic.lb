import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Context } from "hono";
import { authenticateRequest } from "./auth";
import { uploadImage } from "./lib/r2";
import { getDb } from "./queries/connection";
import { photoLibrary } from "@db/schema";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const IMAGE_TYPES = {
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes: Uint8Array) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 8 &&
      bytes
        .subarray(0, 8)
        .every(
          (byte, index) =>
            byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index],
        ),
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP",
  },
  "image/gif": {
    extension: "gif",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 6 &&
      ["GIF87a", "GIF89a"].includes(
        String.fromCharCode(...bytes.subarray(0, 6)),
      ),
  },
} as const;

async function isAdminSession(context: Context) {
  try {
    const session = await authenticateRequest(context.req.raw.headers);
    return (
      session.user.role === "admin" && session.authMethod === "admin_password"
    );
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "No session cookie found.",
        "Invalid session token.",
        "Session user no longer exists.",
      ].includes(error.message)
    ) {
      return false;
    }
    throw error;
  }
}

export async function uploadProductImage(context: Context) {
  if (!(await isAdminSession(context))) {
    return context.json({ error: "Admin sign-in required." }, 401);
  }

  let formData: FormData;
  try {
    formData = await context.req.formData();
  } catch {
    return context.json({ error: "Invalid image upload." }, 400);
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return context.json({ error: "Choose an image file to upload." }, 400);
  }

  if (image.size === 0 || image.size > MAX_IMAGE_SIZE) {
    return context.json(
      { error: "Image must be between 1 byte and 5 MB." },
      400,
    );
  }

  const type = IMAGE_TYPES[image.type as keyof typeof IMAGE_TYPES];
  if (!type) {
    return context.json({ error: "Use a JPEG, PNG, WebP, or GIF image." }, 400);
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!type.matches(bytes)) {
    return context.json(
      { error: "The selected file is not a valid image of that type." },
      400,
    );
  }

  const filename = `${randomUUID()}.${type.extension}`;
  const key = `library/${filename}`;

  try {
    const url = await uploadImage(Buffer.from(bytes), key, image.type);

    await getDb()
      .insert(photoLibrary)
      .values({
        url,
        storageKey: key,
        fileName: image.name.slice(0, 255) || filename,
        mimeType: image.type,
        fileSize: image.size,
      });

    return context.json({ url });
  } catch (error) {
    console.error("Photo Library upload failed:", error);
    return context.json(
      { error: "Image upload failed. Please try again." },
      500,
    );
  }
}

// Kept temporarily for compatibility with any existing route imports.
// New images are served directly from the public R2 URL.
export async function getProductImage(context: Context) {
  const filename = context.req.param("filename");
  if (!filename || !/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(filename)) {
    return context.json({ error: "Image not found." }, 404);
  }

  // This endpoint only serves images from the old local uploads directory.
  const imageDirectory = path.resolve(
    process.env.PRODUCT_IMAGE_UPLOAD_DIR || "uploads/products",
  );

  try {
    const bytes = await readFile(path.join(imageDirectory, filename));
    const contentType = filename.endsWith(".jpg")
      ? "image/jpeg"
      : `image/${path.extname(filename).slice(1)}`;

    return context.body(bytes, 200, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return context.json({ error: "Image not found." }, 404);
    }
    throw error;
  }
}
