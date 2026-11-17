import { pgTable, boolean, serial, text, timestamp } from "drizzle-orm/pg-core";
import { ulid } from "ulid";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    publicId: text("public_id").$defaultFn(() => ulid()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    isVerified: boolean("is_verified").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;