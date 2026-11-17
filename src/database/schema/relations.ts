import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { stores } from "./stores.schema";

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