ALTER TABLE "admin_config" ADD COLUMN IF NOT EXISTS "session_version" integer DEFAULT 1 NOT NULL;

CREATE TABLE IF NOT EXISTS "admin_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "action" varchar(60) NOT NULL,
  "detail" varchar(300),
  "ip" varchar(64),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
