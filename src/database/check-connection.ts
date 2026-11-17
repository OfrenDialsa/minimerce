import { db } from "./index";
import { sql } from "drizzle-orm";

async function checkConnection() {
    try {
        const result = await db.execute(sql`SELECT NOW()`);
        console.log("[v] Koneksi database BERHASIL!");
        console.log("Waktu server database:", result);
    } catch (error) {
        console.error("[x] Koneksi database GAGAL:", error);
    }
}

checkConnection();