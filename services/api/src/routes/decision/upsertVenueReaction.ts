import type { SessionRepository } from "../../modules/session/repository";
import { SessionDomainError } from "../../modules/session/repository";
import { venueReactionSchema } from "./validation";

export async function upsertVenueReactionHandler(
  payload: unknown,
  deps: { repository: SessionRepository }
): Promise<{ status: number; body: unknown }> {
  const parsed = venueReactionSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "INVALID_DECISION_PAYLOAD" } };
  }

  try {
    const reaction = deps.repository.upsertVenueReaction(parsed.data);
    return { status: 200, body: { reaction } };
  } catch (error) {
    if (error instanceof SessionDomainError) {
      return { status: 404, body: { error: "SESSION_NOT_FOUND" } };
    }

    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
