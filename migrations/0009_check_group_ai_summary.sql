ALTER TABLE "check_groups" ADD COLUMN IF NOT EXISTS "ai_summary" text;
ALTER TABLE "check_groups" ADD COLUMN IF NOT EXISTS "ai_summary_at" timestamp with time zone;
