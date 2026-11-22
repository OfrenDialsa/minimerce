import { Address } from "@/database/schema";

export type UserProfile = {
    id: number;
    publicId: string | null;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string | null;
    defaultAddressId: number | null;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
    defaultAddress: Address | null;
};