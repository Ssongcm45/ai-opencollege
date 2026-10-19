import { requireAgent, type AgentIdentity } from "@/lib/agent-auth";
import { agentErrorResponse, handleAgentError, originAllowed } from "@/lib/agent-http";

/* 에이전트 REST 라우트 공통 — Origin 검사, 키 인증·권한·요청 제한 후 handler 실행 */
export async function withAgent(req: Request, handler: (agent: AgentIdentity) => Promise<Response>) {
  try {
    if (!originAllowed(req)) return agentErrorResponse(403, "허용되지 않은 Origin 입니다.");
    const gate = await requireAgent(req);
    if ("failure" in gate) return agentErrorResponse(gate.failure.status, gate.failure.error, gate.failure.headers);
    return await handler(gate.agent);
  } catch (error) {
    return handleAgentError(error);
  }
}
