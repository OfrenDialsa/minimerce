import { z } from "zod";

const optionalCoordFromForm = z.preprocess((val) => {
    if (val === null || val === undefined) return undefined;
    const str = String(val).trim();
    if (str === "") return undefined;
    const num = Number(str);
    return Number.isFinite(num) ? num : val;
}, z.number().optional());

const optionalBooleanFromForm = z.preprocess((val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
        return val === "true" || val === "on" || val === "1";
    }
    return false;
}, z.boolean().optional());

export const addressSchema = z.object({
    label: z
        .string()
        .trim()
        .min(2, "Label alamat minimal 2 karakter (misal: Rumah, Toko)")
        .max(50, "Label alamat maksimal 50 karakter"),
    recipientName: z
        .string()
        .trim()
        .min(2, "Nama penerima minimal 2 karakter")
        .max(100, "Nama penerima maksimal 100 karakter"),
    phone: z
        .string()
        .trim()
        .min(8, "Nomor HP minimal 8 digit")
        .max(20, "Nomor HP maksimal 20 digit")
        .regex(/^[0-9+\-\s()]+$/, "Format nomor HP tidak valid"),
    addressLine: z
        .string()
        .trim()
        .min(5, "Alamat jalan minimal 5 karakter")
        .max(300, "Alamat jalan maksimal 300 karakter"),
    postalCode: z
        .string()
        .trim()
        .regex(/^\d{5}$/, "Kode pos harus 5 digit angka"),
    province: z
        .string()
        .trim()
        .min(2, "Provinsi wajib diisi")
        .max(100),
    city: z
        .string()
        .trim()
        .min(2, "Kabupaten/Kota wajib diisi")
        .max(100),
    district: z.string().trim().max(100).optional().or(z.literal("")),
    village: z.string().trim().max(100).optional().or(z.literal("")),
    latitude: optionalCoordFromForm.refine(
        (val) => val === undefined || (val >= -90 && val <= 90),
        "Latitude tidak valid"
    ),
    longitude: optionalCoordFromForm.refine(
        (val) => val === undefined || (val >= -180 && val <= 180),
        "Longitude tidak valid"
    ),
    isDefault: optionalBooleanFromForm,
});