import { randomBytes } from "node:crypto";
import { createSessionRequestSchema } from "../../modules/session/validation";
import type { SessionRepository } from "../../modules/session/repository";

export interface CreateSessionHandlerDeps {
  repository: SessionRepository;
  appUrl: string;
}

export async function createSessionHandler(
  payload: unknown,
  deps: CreateSessionHandlerDeps
): Promise<{ status: number; body: { sessionId: string; joinUrl: string; participantId: string } | { error: string } }> {
  const parsed = createSessionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "Invalid create-session payload" } };
  }

  const joinToken = randomBytes(24).toString("base64url");
  const created = deps.repository.createSession({ joinToken, role: parsed.data.role });

  return {
    status: 201,
    body: {
      sessionId: created.sessionId,
      joinUrl: `${deps.appUrl.replace(/\/$/, "")}/s/${created.joinToken}`,
      participantId: created.participantId
    }
  };
}
