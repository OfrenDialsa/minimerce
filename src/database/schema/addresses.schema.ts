import { pgTable, serial, doublePrecision, boolean, timestamp, text, integer, type AnyPgColumn } from "drizzle-orm/pg-core";
import { users } from "./users.schema";

export const addresses = pgTable("addresses", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    recipientName: text("recipient_name").notNull(),
    phone: text("phone").notNull(),
    addressLine: text("address_line").notNull(),
    postalCode: text("postal_code").notNull(),
    village: text("village"),
    district: text("district"),
    city: text("city").notNull(),
    province: text("province").notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type NewAddresses = typeof addresses.$inferInsert;