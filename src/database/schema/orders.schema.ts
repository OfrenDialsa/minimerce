import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { ulid } from "ulid";
import { users } from "./users.schema";
import { stores } from "./stores.schema";

export const orders = pgTable("orders", {
    id: text("id").primaryKey().$defaultFn(() => ulid()),
    publicId: text("public_id").$defaultFn(() => ulid()),
    buyerId: integer("buyer_id")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    storeId: integer("store_id")
        .notNull()
        .references(() => stores.id, { onDelete: "restrict" }),
    totalAmount: integer("total_amount").notNull(),
    status: text("status").default("PENDING").notNull(),
    shippingAddress: text("shipping_address").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Orders = typeof orders.$inferSelect;
export type NewOrders = typeof orders.$inferInsert;