CREATE TABLE IF NOT EXISTS check_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  code varchar(40) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT check_groups_code_unique UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS check_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  role varchar(60),
  frequency varchar(60),
  environment varchar(120),
  purpose varchar(60),
  answers jsonb NOT NULL,
  score_a integer NOT NULL,
  score_b integer NOT NULL,
  score_c integer NOT NULL,
  score_d integer,
  score_e integer NOT NULL,
  valid_average double precision NOT NULL,
  base_level integer NOT NULL,
  final_level integer NOT NULL,
  d_applicable boolean NOT NULL,
  gate_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
