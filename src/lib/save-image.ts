import "server-only";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const ALLOWED_MIME_TYPES: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
};

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export async function saveLocalImage(
    file: unknown,
    subFolder = "uploads"
): Promise<{ url: string } | { error: string }> {
    if (!(file instanceof File) || file.size === 0) {
        return { error: "File gambar tidak ditemukan atau kosong." };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return { error: "Ukuran gambar maksimal 2 MB." };
    }

    const ext = ALLOWED_MIME_TYPES[file.type];
    if (!ext) {
        return {
            error: "Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.",
        };
    }

    const safeSubFolder = subFolder.replace(/[^a-zA-Z0-9/_-]/g, "");
    const uploadDir = path.join(process.cwd(), "public", safeSubFolder);
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${crypto.randomUUID()}${ext}`;
    const fullPath = path.join(uploadDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(fullPath, buffer);

    const publicUrl = `/${safeSubFolder.replace(/^\/+|\/+$/g, "")}/${fileName}`;
    return { url: publicUrl };
}