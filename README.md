# AI OpenCollege Landing Page

This workspace is for iterating the AI OpenCollege landing page from the existing standalone HTML file.

## Base File

Use this file as the source of truth for the current design and content baseline:

```text
D:\opencollege\ai_opencollege_v4_1.html
```

oss style 의 톤앤매너를 만들고, Toss ad 의 Hook 형태를 빌려와야해. 그리고 Next.js 는 16ver 이상의 최신, twillind css v4, neon db. 에디토리얼톤 제거. Pretendard 폰트로 일체화. 컬러 팔레트: 잉크 네이비 #0E1B3C × 페이퍼 크림 #F2EFE8 × 단청 버밀리언 #E85A3E — 한국적 권위와 모던 AI의 균형. 디지털_정부서비스_UIUX_가이드라인(2024.02) 기반의 디자인 적용!

## Brand Direction

AI OpenCollege is a practical AI education provider for public institutions, companies, universities, and individual learners.

The page should communicate:

- AI education that leaves real work outputs
- Public-sector trust
- Modern AI fluency
- Practical, non-editorial Korean copy
- Toss-style clarity and conversion-oriented structure

## Visual System

Keep the existing visual identity:

- Ink navy: `#0E1B3C`
- Paper cream: `#F2EFE8`
- Dancheong vermilion: `#E85A3E`
- Font: Pretendard

Avoid visible references to implementation stacks such as Next.js, Tailwind CSS, Neon DB, or government UI/UX guidelines.

## Recommended v4.2 Page Structure

1. Hero
2. Why
3. Trust
4. Courses
5. Curriculum
6. Client Cases
7. Reviews
8. Blog
9. Student Portfolio
10. Field Cases
11. FAQ
12. Certification
13. Process
14. Pricing / Inquiry
15. CTA
16. Footer

## Conversion Strategy

Use these persuasion frames carefully:

- Framing effect: AI education as work redesign, not tool training
- Loss aversion: work gaps quietly widen when repeated tasks remain manual
- Contrast effect: lecture vs output, tool intro vs work application, one-time class vs reusable templates
- Choice architecture: 8 use cases, 8 representative tracks, 3 pricing options
- Ownership effect: show what learners take away
- Anchoring: show time-saving value before pricing
- Rule of three: Basic / Standard / Premium
- Power of free: free AI work diagnostic materials near CTA

## Hero Frame

Main headline:

```text
AI를 배우는 교육이 아니라,
내 업무에 AI가 들어올 자리를 만드는 교육
```

Sub headline:

```text
ChatGPT 사용법만 배우고 끝나는 교육이 아닙니다.
보고서, 기획안, 콘텐츠, 회의록, 반복 업무까지
실제 업무 결과물로 남기는 AI 실무교육입니다.
```

Buttons:

- 내 업무에 AI 적용하기
- 커리큘럼 먼저 보기

## Curriculum

Use 8 representative tracks on the landing page:

1. AI 완전 기초 과정
2. 사무직 AI 업무활용 과정
3. AI 문서·보고서 자동화 과정
4. AI 콘텐츠·마케팅 과정
5. AI 업무자동화·에이전트 과정
6. AI 전략기획·리더십 과정
7. AI 강사양성과정
8. 기관 맞춤 정규교육과정

Each track should clearly show:

- Who it is for
- What it teaches
- Recommended hours
- What remains after training

Add a visible subsection:

```text
교육 후 남는 결과물
```

## Pricing

Pricing is time-based and should be shown as 3 options:

| Plan     | Frame                          | Price            |
| -------- | ------------------------------ | ---------------- |
| Basic    | AI를 이해하는 과정             | 298,000원 / 시간 |
| Standard | AI를 업무에 적용하는 과정      | 397,000원 / 시간 |
| Premium  | AI 업무 시스템을 설계하는 과정 | 490,000원 / 시간 |

Standard should be visually emphasized as the recommended option.

Include this note:

```text
모든 금액은 시간당 교육 단가 기준입니다.
최종 견적은 교육 시간, 인원, 장소, 커리큘럼 범위, 실습 피드백 방식에 따라 조정될 수 있습니다.
공공기관·기업·대학·단체 출강의 경우 요청 목적에 맞춰 제안서와 커리큘럼을 별도로 구성해드립니다.
```

## CTA

CTA should use a free diagnostic offer:

```text
교육 문의만 남겨도
AI 업무 활용 진단지를 먼저 보내드립니다.
```

Free materials:

- AI 업무 활용 진단지
- 초보자용 프롬프트 10종
- 보고서 작성 프롬프트 템플릿
- AI 결과물 검토 체크리스트

## Content Rules

Do not include:

- Next.js 16 이상
- Tailwind CSS v4 이상
- Neon DB
- `(주)유에이지,오픈컬리지`
- `대표기관` labels in Client Cases

Blog content should build trust through:

- 교육 방법론
- 출강 준비
- 출강 운영
- 출강 후 회고
- 기술 문서

Field cases should include:

- 대학·청년 취업준비 과정: `300시간`
- 영상크리에이터 과정: `20시간`

## Verification Checklist

Before finishing, check:

- No forbidden implementation-stack text remains
- No UDEMY text remains
- Client Cases has no `client-nums` block
- Client Cases has no `대표기관` label
- Curriculum has 8 representative tracks
- Pricing has 3 cards
- Standard is visually emphasized
- CTA includes free diagnostic materials
- Page remains standalone and opens directly as HTML
