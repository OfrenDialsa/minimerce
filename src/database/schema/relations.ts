import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { stores } from "./stores.schema";
import { products } from "./products.schema";
import { orderItems } from "./order-items.schema";
import { orders } from "./orders.schema";
import { passwordResetTokens } from "./password-reset-tokens.schema";
import { addresses } from "./addresses.schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  store: one(stores, {
    fields: [users.id],
    references: [stores.userId],
  }),

  addresses: many(addresses, {
    relationName: "user_addresses",
  }),
  defaultAddress: one(addresses, {
    fields: [users.defaultAddressId],
    references: [addresses.id],
    relationName: "user_default_address",
  }),

  orders: many(orders),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
    relationName: "user_addresses",
  }),

}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.userId],
    references: [users.id],
  }),

  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
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

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  users: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id]
  })


}));

