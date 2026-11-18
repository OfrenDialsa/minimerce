import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.schema";

export const passwordResetTokens = pgTable("password_reset_token", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    usedAt: timestamp("used_at", { mode: "date" }),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});