-- 블로그 SEO 설정과 외부 AI 에이전트 초안 등록(에이전트 키).
-- 코드 배포 전에 먼저 적용한다. 공개 블로그·관리자 화면이 새 열을 조회하므로 순서가 바뀌면 블로그가 오류를 낸다.
-- 기존 글은 바꾸지 않는다(새 열은 비어 있거나 noindex=false).
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_title varchar(200);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_description varchar(500);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_keywords varchar(500);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_image varchar(500);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url varchar(500);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS created_by_agent varchar(100);
-- 초안을 만든 키. 그 키만 초안을 조회·수정할 수 있고, 관리자가 저장하면 null 이 되어 에이전트 손을 떠난다.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS created_by_agent_key_id uuid;

-- 원문 키는 저장하지 않는다. key_hash 는 SHA-256 hex.
CREATE TABLE IF NOT EXISTS agent_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  key_prefix varchar(16) NOT NULL,
  key_hash varchar(64) NOT NULL,
  scopes varchar(200) NOT NULL DEFAULT 'blog:draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT agent_keys_key_hash_unique UNIQUE (key_hash)
);
