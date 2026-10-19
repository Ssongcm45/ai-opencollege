# 외부 AI 에이전트 블로그 초안 등록

허가한 외부 AI 에이전트가 AI OpenCollege 블로그에 글을 **초안(비공개)** 으로 등록하는 기능입니다.
에이전트는 초안을 만들고 고치는 것까지만 할 수 있고, **공개(발행)는 언제나 관리자가 관리자 화면에서 직접** 합니다.

- 원격 MCP 서버: `https://opencollege.co.kr/api/mcp` (Streamable HTTP, 상태 없음)
- REST API: `https://opencollege.co.kr/api/agent/blog/...`
- 인증: 에이전트마다 따로 발급하는 API 키 — `Authorization: Bearer <키>`

주소의 도메인은 `NEXT_PUBLIC_SITE_URL` 을 따릅니다.

## 1. 키 발급·폐기

1. 관리자 로그인 → 왼쪽 메뉴 **에이전트 키** (`/admin/agents`)
2. 에이전트 이름을 적고 **키 발급** → `oc_agent_...` 키가 **한 번만** 표시됩니다. 바로 복사해 에이전트 쪽 비밀 저장소에 넣으세요.
3. 더 쓰지 않거나 새어 나간 키는 **폐기**합니다. 폐기한 키는 즉시 401 로 거부됩니다 (되돌릴 수 없음 — 새로 발급).

키 이름은 그 키로 만든 초안에 `에이전트 등록: <이름>` 으로 표시됩니다 (`blog_posts.created_by_agent`).
키 발급·폐기와 에이전트의 초안 등록·수정은 **보안 로그**(`/admin/security`)에 남습니다 (`agent-key.*`, `agent.draft-*`).

## 2. MCP 연결

### Claude Code

```bash
claude mcp add --transport http opencollege-blog https://opencollege.co.kr/api/mcp \
  --header "Authorization: Bearer oc_agent_xxxxxxxx"
```

### 일반 JSON 설정 (Streamable HTTP 를 지원하는 클라이언트)

```json
{
  "mcpServers": {
    "opencollege-blog": {
      "type": "http",
      "url": "https://opencollege.co.kr/api/mcp",
      "headers": { "Authorization": "Bearer oc_agent_xxxxxxxx" }
    }
  }
}
```

지원 프로토콜 버전: `2025-06-18`, `2025-03-26`, `2024-11-05`. 응답은 항상 `application/json` 이며 SSE 스트림(GET)·세션은 쓰지 않습니다.

### 도구

| 도구 | 설명 |
|---|---|
| `list_blog_categories` | 관리자가 정한 카테고리 목록. 초안의 `category` 는 이 중 하나여야 함 |
| `create_blog_draft` | 초안 등록 (`title`, `content`, `category` 필수) |
| `update_blog_draft` | 초안 부분 수정 (`id` + 바꿀 필드만) |
| `get_blog_draft` | 초안 하나 전체 조회 |
| `list_blog_drafts` | 이 키로 등록한 미발행 초안 목록 (최근 100개) |
| `upload_blog_image` | 이미지를 먼저 올리고 주소·마크다운 조각 받기 (`image`, `alt?`) |

도구 실패(검사 오류 등)는 `isError: true` 결과로, 알 수 없는 메서드·잘못된 JSON 은 JSON-RPC 오류(-32601, -32700, -32602)로 돌려줍니다.

## 3. REST API

```bash
KEY=oc_agent_xxxxxxxx
BASE=https://opencollege.co.kr

# 카테고리
curl -H "Authorization: Bearer $KEY" $BASE/api/agent/blog/categories

# 초안 등록
curl -X POST $BASE/api/agent/blog/drafts \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{
    "title": "공공기관 생성형 AI 교육 준비 체크리스트",
    "subtitle": "출강 전에 확인할 10가지",
    "category": "METHOD",
    "content": "## 들어가며\n\n본문...\n\n![구성도](https://example.com/diagram.png)",
    "thumbnail": "data:image/png;base64,iVBORw0KGgo...",
    "seo": { "description": "검색 결과 설명", "keywords": ["AI 교육", "공공기관"] }
  }'

# 목록 / 조회 / 부분 수정 (id 는 등록 결과의 UUID)
curl -H "Authorization: Bearer $KEY" $BASE/api/agent/blog/drafts
curl -H "Authorization: Bearer $KEY" $BASE/api/agent/blog/drafts/<id>
curl -X PATCH $BASE/api/agent/blog/drafts/<id> \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{ "subtitle": "새 요약", "seo": { "noindex": false } }'
```

등록·수정 응답:

```json
{
  "id": "6f1c…-uuid", "slug": "post-20261019-a1b2", "status": "draft", "title": "...",
  "previewUrl": "https://opencollege.co.kr/admin/preview/blog/<id>",
  "editUrl": "https://opencollege.co.kr/admin/blog/<id>",
  "images": [{ "source": "https://example.com/diagram.png", "url": "https://<store>.public.blob.vercel-storage.com/blog/....webp" }]
}
```

오류는 `{ "error": "..." }` 형식이며 상태 코드는 400(입력 오류)·401(키 없음/잘못됨/폐기)·403(권한 없음, 발행된 글, Origin 불일치 등)·404·409(수정 중 발행됨, slug 충돌)·413(본문 8MB 초과)·429(요청 제한)·503(DB·이미지 저장소 미설정)입니다.

## 4. 필드 → DB 컬럼

| 입력 필드 | 컬럼 | 규칙 |
|---|---|---|
| `title` | `title` | 필수, 180자 이하 |
| `subtitle` | `excerpt` | 제목 아래 한 줄 요약, 300자 이하. 없으면 본문 앞 140자로 만든다 (비울 수 없음) |
| `content` | `content` | 필수, 100,000자 이하. 기본은 마크다운이며 서버에서 HTML 로 바꿔 저장 |
| `contentFormat` | — | `markdown`(기본) 또는 `html`. 어느 쪽이든 관리자 편집기와 같은 허용 태그로 정리(sanitize) |
| `category` | `category` | 필수, `list_blog_categories` 값 중 하나 (대소문자 무시) |
| `slug` | `slug` | 선택. 영문 소문자·숫자·`-` 만. 없으면 제목의 영문·숫자로 만들고, 쓸 글자가 3자 미만이면 `post-YYYYMMDD-xxxx`. 전체 글과 겹치면 `-2`, `-3` … |
| `thumbnail` | `thumbnail_url` | 이미지 규칙 참고 |
| `seo.title` | `seo_title` | 200자 이하, 없으면 제목 |
| `seo.description` | `seo_description` | 500자 이하, 없으면 요약 |
| `seo.keywords` | `seo_keywords` | 문자열(쉼표 구분) 또는 배열 → 쉼표로 합쳐 저장, 500자 이하 |
| `seo.ogImage` | `og_image` | 이미지 규칙 참고, 없으면 썸네일 |
| `seo.canonicalUrl` | `canonical_url` | 우리 사이트 `https://` 주소만 |
| `seo.noindex` | `noindex` | true 면 검색 제외(사이트맵·llms.txt 에서도 빠짐) |
| (자동) | `created_by_agent` | 키 이름 |
| (고정) | `published=false`, `featured=false`, `published_at=null` | 에이전트가 바꿀 수 없음 (`published`·`featured` 를 보내면 403) |

수정(`PATCH`, `update_blog_draft`)은 보낸 필드만 바꿉니다. 선택 필드(`thumbnail`, `seo.*`)에 `null` 을 보내면 비웁니다.
에이전트는 **자기 키로 만든 미발행 초안만** 조회·수정할 수 있습니다 (다른 키의 초안, 발행된 글, 관리자가 쓴 글, 관리자가 한 번이라도 저장한 글은 403). MCP JSON-RPC 배치(배열) 요청은 받지 않습니다.
`get_blog_draft` 의 `content` 는 저장된 HTML 입니다 (`contentFormat: "html"`). 이어서 고칠 때는 `contentFormat: "html"` 로 보내거나 마크다운 전체를 다시 보내세요.

## 5. 이미지 규칙

- 썸네일, `seo.ogImage`, 본문의 모든 이미지(`![설명](주소)`, `<img src>`)는 다음 중 하나여야 합니다.
  - `https://` 이미지 주소
  - `data:image/(png|jpeg|webp|gif);base64,...`
- 우리 Vercel Blob 스토어에 이미 있는 이미지가 아니면 모두 **Blob 의 `blog/` 아래로 옮겨 저장**하고 주소를 바꿔 넣습니다. 관리자 업로드와 같이 1600px 이하 WebP 로 다시 인코딩합니다.
- 이미지당 5MB 이하, JPG·PNG·WebP·GIF (파일 시그니처 확인 후 디코딩), 본문 이미지 최대 20개.
- 외부 주소 가져오기는 SSRF 방지 규칙을 따릅니다: https·443 포트만, 주소 안 계정정보 금지, DNS 결과가 사설·루프백·링크로컬·CGNAT·메타데이터 대역(IPv4/IPv6, `::ffff:` 매핑 포함)이면 거부(실제 연결 직전 lookup 에서도 다시 검사), 리다이렉트 최대 3번(매번 재검사), 10초 제한, 응답 `Content-Type` 이 `image/*` 여야 함.
- 이미지 하나라도 실패하면 글을 저장하지 않고 어느 이미지가 왜 실패했는지 알려 줍니다.

## 6. 요청 제한

- 키당 1분에 30회 (서버 인스턴스별로 메모리에서 셈). 넘으면 429 + `Retry-After`.
- 요청 본문 최대 8MB (base64 이미지 포함).

## 7. 보안 메모

- 키 원문은 저장하지 않고 SHA-256 해시만 보관합니다 (`agent_keys.key_hash`). 관리자 화면에는 앞 16자만 보입니다. 서버 로그에도 키·요청 본문을 남기지 않습니다.
- 키는 언제든 폐기할 수 있고, 폐기·잘못된 키는 401 (`WWW-Authenticate: Bearer`) 입니다.
- 에이전트는 초안만 다루며 공개·대표 글 지정·삭제를 할 수 없습니다. 공개는 관리자가 `/admin/blog` 에서 미리보기(`/admin/preview/blog/<id>`)로 확인한 뒤 합니다.
- 초안은 공개 블로그 목록·글 페이지(메타데이터 포함)·홈·사이트맵·RSS·llms.txt 어디에도 나오지 않습니다.
- MCP·REST 엔드포인트는 `Origin` 헤더가 있으면 `NEXT_PUBLIC_SITE_URL` 의 origin 과 그 `www.` 주소만 허용합니다 (DNS 재바인딩 방지).
- 엔드포인트는 `/api/admin` 밖(`/api/agent`, `/api/mcp`)에 있어 관리자 세션 쿠키가 아니라 키로만 인증합니다 (`middleware.ts` 대상 아님).

## 8. 배포 메모

1. **DB 마이그레이션을 먼저 적용합니다**: `migrations/0015_agent_blog_drafts.sql` (`blog_posts` SEO·`created_by_agent` 열, `agent_keys` 테이블).
   공개 블로그와 관리자 화면이 새 열을 조회하므로, 코드를 먼저 배포하면 블로그가 오류를 냅니다.
   이 프로젝트의 수동 마이그레이션 파일이므로 `db:push`·`db:migrate` 가 아니라 이 파일을 직접 적용하고, `npm run db:check` 로 열이 생겼는지 확인합니다.
2. 그다음 코드를 배포합니다.
3. 환경변수: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`(주소·canonical·Origin 검사 기준), `BLOB_READ_WRITE_TOKEN`(이미지 저장 — Vercel 에서 Blob 스토어를 연결하면 자동 설정, 관리자 썸네일 업로드도 이미 이 값을 씀). 없으면 이미지가 있는 초안은 503 으로 거부됩니다.
