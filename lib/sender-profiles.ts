export type SenderProfileId = "uag" | "opencollege" | "uag-oc";

export const SENDER_PROFILES: { id: SenderProfileId; label: string; lines: string[] }[] = [
  {
    id: "uag",
    label: "(주)유에이지",
    lines: [
      "상호: (주)유에이지 · 대표자: 송창민",
      "사업자등록번호: 178-86-02718 · support@uag.im",
      "소셜벤처판별기업 · 이러닝사업자등록 · ISO27001"
    ]
  },
  {
    id: "opencollege",
    label: "오픈컬리지",
    lines: [
      "상호: 오픈컬리지 · 대표자: 송창민",
      "사업자등록번호: 216-24-96640 · edu@opencollege.co.kr"
    ]
  },
  {
    id: "uag-oc",
    label: "(주)유에이지 + 오픈컬리지 브랜드",
    lines: [
      "상호: (주)유에이지 (브랜드: 오픈컬리지) · 대표자: 송창민",
      "사업자등록번호: 178-86-02718 · support@uag.im",
      "소셜벤처판별기업 · 이러닝사업자등록 · ISO27001"
    ]
  }
];
