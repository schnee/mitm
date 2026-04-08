import { SessionDomainError, type SessionRepository } from "../../modules/session/repository";
import { joinSessionRequestSchema } from "../../modules/session/validation";

export interface JoinSessionHandlerDeps {
  repository: SessionRepository;
}

export async function joinSessionHandler(
  payload: unknown,
  deps: JoinSessionHandlerDeps
): Promise<{ status: number; body: { sessionId: string; participantId: string } | { error: string } }> {
  const parsed = joinSessionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "Invalid join-session payload" } };
  }

  try {
    const joined = deps.repository.joinSession({
      joinToken: parsed.data.joinToken,
      role: parsed.data.role
    });
    return { status: 200, body: joined };
  } catch (error) {
    if (!(error instanceof SessionDomainError)) {
      return { status: 500, body: { error: "Unexpected error" } };
    }

    if (error.code === "SESSION_NOT_FOUND") {
      return { status: 404, body: { error: error.code } };
    }
    if (error.code === "SESSION_FULL") {
      return { status: 409, body: { error: error.code } };
    }
    if (error.code === "SESSION_EXPIRED") {
      return { status: 410, body: { error: error.code } };
    }

    return { status: 400, body: { error: error.code } };
  }
}
