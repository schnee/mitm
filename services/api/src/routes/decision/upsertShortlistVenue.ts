import type { SessionRepository } from "../../modules/session/repository";
import { SessionDomainError } from "../../modules/session/repository";
import { shortlistVenueSchema } from "./validation";

export async function upsertShortlistVenueHandler(
  payload: unknown,
  deps: { repository: SessionRepository }
): Promise<{ status: number; body: unknown }> {
  const parsed = shortlistVenueSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "INVALID_DECISION_PAYLOAD" } };
  }

  try {
    const shortlist = deps.repository.upsertShortlistVenue(parsed.data);
    return { status: 200, body: { shortlist } };
  } catch (error) {
    if (error instanceof SessionDomainError) {
      return { status: 404, body: { error: "SESSION_NOT_FOUND" } };
    }
    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
