CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope varchar(20) NOT NULL,
  name varchar(60) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_scope_name_unique UNIQUE (scope, name)
);

INSERT INTO categories (scope, name)
SELECT 'blog', name FROM blog_categories
ON CONFLICT DO NOTHING;
