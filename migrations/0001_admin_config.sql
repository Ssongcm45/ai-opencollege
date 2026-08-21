CREATE TABLE IF NOT EXISTS "admin_config" (
  "id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
  "password_hash" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
