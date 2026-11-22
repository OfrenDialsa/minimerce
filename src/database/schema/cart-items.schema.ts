import {
    pgTable,
    serial,
    text,
    integer,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { ulid } from "ulid";
import { users } from "./users.schema";
import { stores } from "./stores.schema";
import { products } from "./products.schema";

export const cartItems = pgTable("cart_items", {
    id: serial("id").primaryKey(),
    publicId: text("public_id")
        .notNull()
        .unique()
        .$defaultFn(() => ulid()),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    storeId: integer("store_id")
        .notNull()
        .references(() => stores.id, { onDelete: "cascade" }),
    productId: integer("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
},
    (table) => [
        uniqueIndex("cart_items_user_product_idx").on(table.userId, table.productId),
    ],
);

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;