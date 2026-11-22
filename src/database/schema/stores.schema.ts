import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { ulid } from "ulid";
import { addresses } from "./addresses.schema";

export const stores = pgTable("stores", {
    id: serial("id").primaryKey(),
    publicId: text("public_id").$defaultFn(() => ulid()),
    userId: integer("user_id")
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    logoUrl: text("logo_url"),
    activeAddressId: integer("active_address_id").references(() => addresses.id, {
        onDelete: "set null",
    }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;