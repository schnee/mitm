import type { SessionRepository } from "../../modules/session/repository";

export async function getSessionSnapshotHandler(
  sessionId: string,
  deps: { repository: SessionRepository }
): Promise<{ status: number; body: unknown }> {
  const snapshot = deps.repository.getSessionSnapshot(sessionId);
  if (!snapshot) {
    return { status: 404, body: { error: "SESSION_NOT_FOUND" } };
  }

  return { status: 200, body: snapshot };
}
