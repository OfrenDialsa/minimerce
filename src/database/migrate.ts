import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL tidak ditemukan di file .env");
}

const migrationClient = postgres(connectionString, { max: 1 });

async function main() {
    const db = drizzle(migrationClient);

    console.log("[~] Sedang menjalankan migrasi database...");

    try {
        await migrate(db, { migrationsFolder: "@/drizzle" });

        console.log("[v] Migrasi database berhasil diselesaikan!");
    } catch (error) {
        console.error("[x] Gagal menjalankan migrasi database:", error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
}

main();