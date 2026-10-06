ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS education_goal text;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS intake_key varchar(64);
CREATE UNIQUE INDEX IF NOT EXISTS inquiries_intake_key_unique ON inquiries(intake_key);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS source varchar(30) NOT NULL DEFAULT 'contact';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS analysis jsonb;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS analysis_status varchar(24) NOT NULL DEFAULT 'not_requested';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS analysis_error text;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS analysis_model varchar(100);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS analysis_at timestamptz;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notification_status varchar(24) NOT NULL DEFAULT 'not_requested';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notification_error text;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notification_provider_id varchar(160);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notification_key varchar(160);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notification_payload jsonb;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notification_attempted_at timestamptz;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS processing_token uuid;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS processing_lease_until timestamptz;

CREATE TABLE IF NOT EXISTS inquiry_rate_limits (
  rate_key varchar(64) PRIMARY KEY,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS inquiry_rate_limits_window_start_idx ON inquiry_rate_limits(window_start);
