import { pgTable, serial, integer, text, timestamp, type AnyPgColumn } from "drizzle-orm/pg-core";
import { ulid } from "ulid";
import { addresses } from "./addresses.schema";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    publicId: text("public_id").$defaultFn(() => ulid()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    role: text("role").default("user"),
    defaultAddressId: integer("default_address_id").references((): AnyPgColumn => addresses.id, { onDelete: "set null" }),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;