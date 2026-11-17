import { db } from "./index";
import { sql } from "drizzle-orm";

async function testConnection() {
    try {
        const result = await db.execute(sql`SELECT NOW()`);
        console.log("[V] Koneksi database BERHASIL!");
        console.log("Waktu server database:", result);
    } catch (error) {
        console.error("[X] Koneksi database GAGAL:", error);
    }
}

testConnection();