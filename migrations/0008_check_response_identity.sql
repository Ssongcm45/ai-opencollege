ALTER TABLE "check_responses" ADD COLUMN IF NOT EXISTS "name" varchar(80);
ALTER TABLE "check_responses" ADD COLUMN IF NOT EXISTS "department" varchar(80);
ALTER TABLE "check_responses" ADD COLUMN IF NOT EXISTS "position" varchar(60);
ALTER TABLE "check_responses" ADD COLUMN IF NOT EXISTS "phone" varchar(60);
ALTER TABLE "check_responses" ADD COLUMN IF NOT EXISTS "email" varchar(160);
ALTER TABLE "check_responses" ADD COLUMN IF NOT EXISTS "note" text;
