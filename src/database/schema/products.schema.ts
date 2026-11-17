import { pgTable, integer, boolean, serial, text, timestamp } from "drizzle-orm/pg-core";
import { ulid } from "ulid";
import { stores } from "./stores.schema";
import { categories } from "./categories.schema";

export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    publicId: text("public_id").$defaultFn(() => ulid()),
    storeId: integer("store_id").notNull().unique()
        .references(() => stores.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
        .references(() => categories.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    stock: integer("stock").default(0).notNull(),
    imageUrl: text("image_url"),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;