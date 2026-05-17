# Initial Prompt for Codex

You are working on a single-file Korean landing page based on:

Create and iterate a new version of the AI OpenCollege landing page while preserving the current visual identity and overall page structure.

```text
D:\opencollege\ai_opencollege_v4_1.html
```

Project Goal

Build a high-converting Korean landing page for AI OpenCollege, an AI practical education provider for public institutions, companies, universities, and individual learners.

The page should feel like a modern Toss-style Korean education/AI service:

- Clear, concise, practical copy
- Pretendard font throughout
- Strong hierarchy and whitespace
- No editorial/essay-like tone
- No unnecessary technical-stack mentions
- Results-first framing
- Public-sector trust + modern AI balance

## Base Tone and Visual System

Use the existing `v4_1` design direction:

- Ink navy: `#0E1B3C`
- Paper cream: `#F2EFE8`
- Dancheong vermilion: `#E85A3E`
- Pretendard font
- Rounded cards should remain restrained
- Maintain the existing hero motion style unless improving it carefully

Avoid adding visible references to implementation technologies such as Next.js, Tailwind CSS, Neon DB, or digital government UI/UX guidelines. Those do not belong in the marketing page.

## Core Positioning

The core frame is:

> AI를 배우는 교육이 아니라, 내 업무에 AI가 들어올 자리를 만드는 교육

This is not a generic AI tool lecture. It is practical AI education that leaves concrete work outputs:

- Reports
- Planning documents
- Content plans
- Meeting notes
- Email/public notices
- Research summaries
- Workflow automation scenarios
- Prompt templates
- AI result review checklists

## Required Page Structure

Keep the broad landing page structure from `v4_1`:

1. Utility bar / header
2. Hero
3. Why
4. Trust
5. Courses
6. Curriculum
7. Client Cases
8. Reviews
9. Blog
10. Student Portfolio
11. Field Cases
12. FAQ
13. Certification
14. Process
15. Ticker
16. CTA
17. Footer

## Hero Requirements

Use this framing:

Main copy:

```text
AI를 배우는 교육이 아니라,
내 업무에 AI가 들어올 자리를 만드는 교육
```

Sub copy:

```text
ChatGPT 사용법만 배우고 끝나는 교육이 아닙니다.
보고서, 기획안, 콘텐츠, 회의록, 반복 업무까지
실제 업무 결과물로 남기는 AI 실무교육입니다.
```

Buttons:

- 내 업무에 AI 적용하기
- 커리큘럼 먼저 보기

Hero stats should communicate:

- 공공·기업·대학 교육 경험
- 내 상황에 맞는 실무 트랙
- 강의보다 결과물 중심
- 조직별 맞춤 커리큘럼 설계

## Why Section

Use loss-aversion without fearmongering. The message should be about quiet work-performance gaps, not panic.

Suggested copy:

```text
AI를 몰라도 당장 일은 할 수 있습니다.
하지만 같은 일을 누군가는 3시간에 하고,
누군가는 AI와 함께 30분 만에 초안을 만듭니다.

차이는 조용히 벌어집니다.
보고서, 기획안, 회의록, 콘텐츠, 자료조사처럼
매일 반복되는 업무에서 먼저 차이가 납니다.

이 교육은 AI를 많이 아는 사람이 되기 위한 과정이 아닙니다.
내 업무 속도와 결과물의 격차를 줄이는 과정입니다.
```

Why cards should use contrast:

- 강의가 아니라 결과물
- 툴 소개가 아니라 업무 적용
- 1회성 교육이 아니라 반복 가능한 템플릿

## Courses Section

Before the education-type tabs, add or maintain 8 use-case cards:

- 보고서 작성
- 기획안 작성
- 회의록 정리
- 이메일·공지문 작성
- 콘텐츠 기획
- 자료조사·요약
- 반복 업무 자동화
- 나만의 프롬프트 템플릿 제작

Then keep the education type structure:

- 공공기관·지자체 출강 교육
- 기업·단체 맞춤 교육
- 개인·오픈 클래스
- K-Digital 국비 과정 준비 중

Do not mention specific old institution names in this section.
Do not mention UDEMY anywhere.

## Curriculum Requirements

Use 8 representative tracks for the landing page:

1. AI 완전 기초 과정
2. 사무직 AI 업무활용 과정
3. AI 문서·보고서 자동화 과정
4. AI 콘텐츠·마케팅 과정
5. AI 업무자동화·에이전트 과정
6. AI 전략기획·리더십 과정
7. AI 강사양성과정
8. 기관 맞춤 정규교육과정

Each curriculum panel should include a subsection:

```text
교육 후 남는 결과물
```

Examples:

- 내 업무용 프롬프트 템플릿
- 보고서 초안 생성 프롬프트
- 회의록 요약 프롬프트
- 이메일 작성 프롬프트
- AI 결과물 검토 체크리스트
- 콘텐츠 기획 프롬프트
- 월간 콘텐츠 캘린더
- 자동화 시나리오
- 에이전트 설계서

This creates ownership effect: learners should feel they will leave with something usable.

## Client Cases

Do not use a `client-nums` block.

Client Cases should be simple:

- Heading: `30+ 기관에서 검증된 AI 교육`
- Then a clean 3x2 logo-like text grid on a white background
- No `logo-wall` naming
- No “대표기관” label

Example names:

- 경기도경제과학진흥원
- 평택대학교
- 청년지원센터
- 도시재생현장센터
- 인재개발원
- 지역교육센터

## Blog Section

The Blog section is not a FAQ. It should increase trust by showing how the organization thinks and documents its work.

Blog should cover:

- 교육 방법론
- 출강 준비
- 출강 운영
- 출강 후 회고
- 기술 문서
- AI 도구를 교육 가능한 자료로 바꾸는 과정

Avoid copy like “자주 나오는 질문들” for the Blog headline.

## Field Cases

Include field cases such as:

- 공공기관 AI 리터러시 과정
- 대학·청년 취업준비 과정: `300시간`
- 영상크리에이터 과정: `20시간`

## Pricing / Inquiry

Add or maintain a pricing/inquiry section with anchoring, 3-option structure, and Standard highlighted.

Plans:

### Basic

AI를 이해하는 과정

`298,000원 / 시간`

Includes:

- 오프라인 강의
- 기본 시각화 가이드 제공
- LMS 프롬프트 라이브러리 제공
- APP 권한 부여

### Standard

AI를 업무에 적용하는 과정

`397,000원 / 시간`

Highlight as:

- 가장 추천
- 가장 많이 선택
- central card

Includes:

- 오프라인 강의
- 실습 자료 전체 제공
- 개인 업무 진단지
- 업무별 프롬프트 템플릿
- 결과물 피드백

### Premium

AI 업무 시스템을 설계하는 과정

`490,000원 / 시간`

Includes:

- Standard 전체 포함
- 1:1 업무 적용 코칭 1회
- 개인 맞춤 프롬프트 피드백
- 자동화 시나리오 설계

Pricing note:

```text
모든 금액은 시간당 교육 단가 기준입니다.
최종 견적은 교육 시간, 인원, 장소, 커리큘럼 범위, 실습 피드백 방식에 따라 조정될 수 있습니다.

공공기관·기업·대학·단체 출강의 경우 요청 목적에 맞춰 제안서와 커리큘럼을 별도로 구성해드립니다.
```

## CTA

Use the power of free.

CTA frame:

```text
교육 문의만 남겨도
AI 업무 활용 진단지를 먼저 보내드립니다.
```

Free materials:

- AI 업무 활용 진단지
- 초보자용 프롬프트 10종
- 보고서 작성 프롬프트 템플릿
- AI 결과물 검토 체크리스트

Buttons:

- 무료 진단지 받기
- 교육 문의하기
- 가격 옵션 보기

## Certification

Certification should only include:

- 이러닝 인증
- 온라인평생교육원 설립중
- 평생교육사 보유

Credential courses:

- AI퍼실리테이터 전문가과정
- AI업무활용능력

Other education tracks are certificate-of-completion style.

Do not mention `(주)유에이지`.

## Things to Avoid

- Do not mention Next.js, Tailwind CSS, Neon DB, or other implementation tech stacks in the visible page.
- Do not mention UDEMY.
- Do not use “대표기관” labels in Client Cases.
- Do not make the copy too editorial or essay-like.
- Do not add a marketing-style hero that loses the actual education product.
- Do not make the page feel like a generic AI tool course.

## Output

Create a new HTML version rather than overwriting the base file.

Suggested filename:

`ai_opencollege_v4_2.html`

Keep it as a standalone HTML file unless explicitly asked to convert it into a framework project.
