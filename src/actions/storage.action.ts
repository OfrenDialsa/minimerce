import path from "path";
import fs from "node:fs/promises";

export async function deleteLocalLogoFile(logoUrl: string | null): Promise<void> {
    if (!logoUrl || !logoUrl.startsWith("/")) {
        return;
    }

    // Hanya hapus file lokal di bawah /uploads/ agar aman dari path traversal
    const normalized = path.posix.normalize(logoUrl);
    if (!normalized.startsWith("/uploads/")) {
        return;
    }

    const publicDir = path.resolve(process.cwd(), "public");
    const relativePath = normalized.replace(/^\/+/, "");
    const fullPath = path.resolve(publicDir, relativePath);

    // Pastikan path final tetap berada di dalam public/uploads
    if (!fullPath.startsWith(path.join(publicDir, "uploads") + path.sep)) {
        return;
    }

    try {
        await fs.unlink(fullPath);
    } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException)?.code;
        if (code !== "ENOENT") {
            console.error("Failed to delete local logo file:", err);
        }
    }
}