ALTER TABLE "orders" ADD COLUMN "payment_proof_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_uploaded_at" timestamp;