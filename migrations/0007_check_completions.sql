CREATE TABLE IF NOT EXISTS check_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(40) NOT NULL DEFAULT 'individual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
