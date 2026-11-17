import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { ulid } from "ulid";
import { orders } from "./orders.schema";
import { products } from "./products.schema";

export const orderItems = pgTable("order_items", {
    id: serial("id").primaryKey(),
    publicId: text("public_id").notNull().unique().$defaultFn(() => ulid()),
    orderId: integer("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    priceAtPurchase: integer("price_at_purchase").notNull(), // Harga produk saat dibeli
});

export type OrderItems = typeof orderItems.$inferSelect;
export type NewOrderItems = typeof orderItems.$inferInsert;