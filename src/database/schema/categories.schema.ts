import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Categories = typeof categories.$inferSelect;
export type NewCategories = typeof categories.$inferInsert;