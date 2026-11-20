import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const verificationTokens = pgTable("verification_token", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
}, (t) => [
    primaryKey({ columns: [t.identifier, t.token] })]
);

export type VerificationTokens = typeof verificationTokens.$inferSelect;
export type NewVerificationTokens = typeof verificationTokens.$inferInsert;