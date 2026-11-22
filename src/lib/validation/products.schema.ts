import { z } from "zod";

const optionalBooleanFromForm = z.preprocess((val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
        return val === "true" || val === "on" || val === "1";
    }
    return false;
}, z.boolean().optional());

export const createProductSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Nama produk minimal 2 karakter")
        .max(150, "Nama produk maksimal 150 karakter"),
    description: z
        .string()
        .trim()
        .max(2000, "Deskripsi produk maksimal 2000 karakter")
        .optional()
        .or(z.literal("")),
    price: z.preprocess((val) => {
        if (typeof val === "number") return val;
        const cleaned = String(val ?? "").replace(/[^\d]/g, "");
        return cleaned === "" ? NaN : Number(cleaned);
    }, z.number().int("Harga harus bilangan bulat").min(100, "Harga minimal Rp100")),
    stock: z.preprocess((val) => {
        if (typeof val === "number") return val;
        const cleaned = String(val ?? "").replace(/[^\d]/g, "");
        return cleaned === "" ? 0 : Number(cleaned);
    }, z.number().int("Stok harus bilangan bulat").min(0, "Stok tidak boleh kurang dari 0")),
    category: z
        .string()
        .trim()
        .max(80, "Kategori maksimal 80 karakter")
        .optional()
        .or(z.literal("")),
    isArchived: optionalBooleanFromForm,
});

export const updateProductSchema = createProductSchema.partial().extend({
    id: z.number().int().positive("ID produk tidak valid"),
});