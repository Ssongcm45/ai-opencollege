// AI 총평 생성에 사용할 수 있는 OpenRouter 모델 목록 (키 유효성 검증 완료).
// 서버 액션은 이 목록으로 화이트리스트 검증하므로 임의 모델 문자열은 거부된다.
export const AI_MODEL_OPTIONS = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (기본 · 빠름)" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (심층 분석)" },
  { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5 (고품질)" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini (경제형)" }
] as const;

export type AiModelId = (typeof AI_MODEL_OPTIONS)[number]["id"];

export function isAllowedAiModel(id: string): id is AiModelId {
  return AI_MODEL_OPTIONS.some((option) => option.id === id);
}
