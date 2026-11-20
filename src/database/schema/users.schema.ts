import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { ulid } from "ulid";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    publicId: text("public_id").$defaultFn(() => ulid()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    role: text("role").default("user"),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;