ALTER TABLE "admin_config" ADD COLUMN IF NOT EXISTS "failed_attempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "admin_config" ADD COLUMN IF NOT EXISTS "locked_until" timestamp with time zone;
