import type { SessionRepository } from "../../modules/session/repository";
import { SessionDomainError } from "../../modules/session/repository";
import { confirmVenueSchema } from "./validation";

export async function confirmVenueHandler(
  payload: unknown,
  deps: { repository: SessionRepository }
): Promise<{ status: number; body: unknown }> {
  const parsed = confirmVenueSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "INVALID_DECISION_PAYLOAD" } };
  }

  try {
    const confirmedPlace = deps.repository.confirmVenue(parsed.data);
    return { status: 200, body: { confirmedPlace } };
  } catch (error) {
    if (error instanceof SessionDomainError && error.code === "PLACE_ALREADY_CONFIRMED") {
      return { status: 409, body: { error: "PLACE_ALREADY_CONFIRMED" } };
    }

    if (error instanceof SessionDomainError) {
      return { status: 404, body: { error: "SESSION_NOT_FOUND" } };
    }
    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
