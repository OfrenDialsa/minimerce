import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
    throw new Error("DATABASE_URL tidak ditemukan di file .env");
}

const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

const client = globalForDb.conn ?? postgres(connectionString, { max: 1 });

if (process.env.NODE_ENV !== "production") {
    globalForDb.conn = client;
}

export const db = drizzle(client, { schema });