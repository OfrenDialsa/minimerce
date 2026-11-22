import { pgTable, text, serial, integer, timestamp, AnyPgColumn } from "drizzle-orm/pg-core";
import { ulid } from "ulid";
import { users } from "./users.schema";
import { stores } from "./stores.schema";
import { addresses } from "./addresses.schema";

export const orders = pgTable("orders", {
    id: serial("id").primaryKey(),
    publicId: text("public_id")
        .notNull()
        .unique()
        .$defaultFn(() => ulid()),
    buyerId: integer("buyer_id")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    storeId: integer("store_id")
        .notNull()
        .references(() => stores.id, { onDelete: "restrict" }),
    totalAmount: integer("total_amount").notNull(),
    status: text("status").default("PENDING").notNull(),
    addressId: integer("address_id").references((): AnyPgColumn => addresses.id, { onDelete: "set null" }),
    paymentProofUrl: text("payment_proof_url"),
    paymentNotes: text("payment_notes"),
    paymentUploadedAt: timestamp("payment_uploaded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Orders = typeof orders.$inferSelect;
export type NewOrders = typeof orders.$inferInsert;