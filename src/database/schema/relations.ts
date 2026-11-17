import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { stores } from "./stores.schema";
import { products } from "./products.schema";
import { categories } from "./categories.schema";
import { orderItems } from "./order-items.schema";
import { orders } from "./orders.schema";

export const usersRelations = relations(users, ({ one }) => ({
  store: one(stores, {
    fields: [users.id],
    references: [stores.userId],
  }),
}));

export const storesRelations = relations(stores, ({ one }) => ({
  owner: one(users, {
    fields: [stores.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),

  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),

  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  users: one(users, {
    fields: [orders.buyerId],
    references: [users.id]
  }),

  stores: one(stores, {
    fields: [orders.storeId],
    references: [stores.id]
  })
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  orders: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),

  products: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));