import { SessionDomainError, type SessionRepository } from "../../modules/session/repository";

const REQUIRED_FUNNEL_EVENTS = [
  "session_start",
  "inputs_set",
  "results_returned",
  "decision_confirmed"
] as const;

type RequiredFunnelEvent = (typeof REQUIRED_FUNNEL_EVENTS)[number];

export async function getSessionFunnelHandler(
  sessionId: string,
  deps: { repository: SessionRepository }
): Promise<{ status: number; body: unknown }> {
  try {
    const events = deps.repository.listFunnelEvents(sessionId);
    const completeness = REQUIRED_FUNNEL_EVENTS.reduce(
      (acc, event) => {
        acc[event] = events.some((item) => item.event === event);
        return acc;
      },
      {} as Record<RequiredFunnelEvent, boolean>
    );

    return {
      status: 200,
      body: {
        sessionId,
        events,
        completeness
      }
    };
  } catch (error) {
    if (error instanceof SessionDomainError && error.code === "SESSION_NOT_FOUND") {
      return { status: 404, body: { error: "SESSION_NOT_FOUND" } };
    }

    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
