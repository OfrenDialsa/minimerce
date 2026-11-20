import { auth } from "@/auth";

export async function getCurrentUserId(): Promise<number | null> {
    try {
        const session = await auth();
        const rawId = session?.user?.id;

        if (!rawId) {
            return null;
        }

        const userId = Number(rawId);
        return Number.isInteger(userId) && userId > 0 ? userId : null;
    } catch {
        return null;
    }
}