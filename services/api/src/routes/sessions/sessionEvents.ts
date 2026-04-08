import type { SessionRepository } from "../../modules/session/repository";

export async function sessionEventsHandler(
  sessionId: string,
  deps: { repository: SessionRepository },
  query?: { since?: string }
): Promise<{ status: number; body: unknown }> {
  const snapshot = deps.repository.getSessionSnapshot(sessionId);
  if (!snapshot) {
    return { status: 404, body: { error: "SESSION_NOT_FOUND" } };
  }

  const events = deps.repository.listSessionEvents(sessionId, query?.since);
  return {
    status: 200,
    body: {
      sessionId,
      events
    }
  };
}
