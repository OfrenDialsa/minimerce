import { NextRequest, NextResponse } from "next/server";
import postalCodes from "@/database/kodepos.json";

type RawPostalEntry = {
    code: number | string;
    village?: string;
    district?: string;
    regency?: string;
    province?: string;
    latitude?: number;
    longitude?: number;
    elevation?: number;
    timezone?: string;
};

export type PostalRegionItem = {
    postalCode: string;
    province: string;
    city: string;
    district: string;
    subDistrict?: string;
    latitude?: number;
    longitude?: number;
};

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";

    if (!/^\d{5}$/.test(code)) {
        return NextResponse.json(
            { error: "Kode pos harus 5 digit angka.", items: [] },
            { status: 400 }
        );
    }

    const matched = (postalCodes as RawPostalEntry[]).filter(
        (entry) => String(entry.code).trim() === code
    );

    const items: PostalRegionItem[] = matched.map((entry) => ({
        postalCode: String(entry.code).trim(),
        province: entry.province ?? "",
        city: entry.regency ?? "",
        district: entry.district ?? "",
        subDistrict: entry.village,
        latitude: entry.latitude,
        longitude: entry.longitude,
    }));

    return NextResponse.json({ items });
}