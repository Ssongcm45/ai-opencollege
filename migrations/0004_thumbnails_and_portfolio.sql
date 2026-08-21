ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "thumbnail_url" varchar(500);
ALTER TABLE "field_cases" ADD COLUMN IF NOT EXISTS "thumbnail_url" varchar(500);
CREATE TABLE IF NOT EXISTS "portfolio_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" varchar(40) NOT NULL,
  "title" varchar(180) NOT NULL,
  "description" text NOT NULL,
  "thumbnail_url" varchar(500),
  "video_url" varchar(500),
  "order" integer DEFAULT 0 NOT NULL,
  "published" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
