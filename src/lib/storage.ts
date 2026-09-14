import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const PUBLIC_UPLOADS_DIR = path.join(PROJECT_ROOT, "public", "uploads");
const PRIVATE_STORAGE_DIR = path.join(PROJECT_ROOT, "storage");

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const ALLOWED_AVATAR_FILE_EXTENSIONS = new Set([
  ".unitypackage",
  ".zip",
  ".vrca",
]);

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_AVATAR_FILE_BYTES = 600 * 1024 * 1024; // 600MB

export class UploadValidationError extends Error {}

function safeExt(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/** Saves an image (thumbnail/preview/profile picture) under /public/uploads and returns its public URL. */
export async function savePublicImage(
  file: File,
  subdir: string
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new UploadValidationError(
      "Unsupported image type. Use PNG, JPEG, WEBP, or GIF."
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadValidationError("Image exceeds the 15MB limit.");
  }

  const dir = path.join(PUBLIC_UPLOADS_DIR, subdir);
  await mkdir(dir, { recursive: true });

  const ext = safeExt(file.name) || ".png";
  const fileName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fileName), buffer);

  return `/uploads/${subdir}/${fileName}`;
}

/**
 * Saves the actual avatar package file to private, non-web-accessible storage.
 * Returned `key` must be used with the gated download route — never exposed as a direct URL.
 */
export async function savePrivateAvatarFile(
  file: File,
  subdir: string
): Promise<{ key: string; fileName: string; sizeBytes: number }> {
  const ext = safeExt(file.name);
  if (!ALLOWED_AVATAR_FILE_EXTENSIONS.has(ext)) {
    throw new UploadValidationError(
      "Unsupported file type. Upload a .unitypackage, .zip, or .vrca file."
    );
  }
  if (file.size > MAX_AVATAR_FILE_BYTES) {
    throw new UploadValidationError("File exceeds the 600MB limit.");
  }

  const dir = path.join(PRIVATE_STORAGE_DIR, subdir);
  await mkdir(dir, { recursive: true });

  const key = `${subdir}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(PRIVATE_STORAGE_DIR, key), buffer);

  return { key, fileName: file.name, sizeBytes: file.size };
}

export async function readPrivateFile(key: string): Promise<Buffer> {
  const resolved = path.join(PRIVATE_STORAGE_DIR, key);
  if (!resolved.startsWith(PRIVATE_STORAGE_DIR)) {
    throw new UploadValidationError("Invalid file key.");
  }
  return readFile(resolved);
}

export async function privateFileExists(key: string): Promise<boolean> {
  try {
    const resolved = path.join(PRIVATE_STORAGE_DIR, key);
    if (!resolved.startsWith(PRIVATE_STORAGE_DIR)) return false;
    await stat(resolved);
    return true;
  } catch {
    return false;
  }
}
