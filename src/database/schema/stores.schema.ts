import {
    pgTable,
    serial,
    text,
    integer,
    timestamp,
    boolean,
    doublePrecision,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { ulid } from "ulid";

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

    address: text("address"),
    postalCode: text("postal_code"),
    province: text("province"),
    city: text("city"),
    district: text("district"),
    village: text("village"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;