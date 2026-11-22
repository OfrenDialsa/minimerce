ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "categories" CASCADE;--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_category_id_categories_id_fk";--> statement-breakpoint
ALTER TABLE "products" RENAME COLUMN "category_id" TO "category";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "category" TYPE text USING "category"::text;