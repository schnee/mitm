import { locationDraftSchema } from "../../modules/location/validation";
import type { LocationRepository } from "../../modules/location/repository";
import { SessionDomainError } from "../../modules/session/repository";

export async function upsertLocationDraftHandler(
  payload: unknown,
  deps: { repository: LocationRepository }
): Promise<{ status: number; body: unknown }> {
  const parsed = locationDraftSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "INVALID_LOCATION_DRAFT" } };
  }

  try {
    const result = deps.repository.upsertLocationDraft(parsed.data);
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof SessionDomainError) {
      return { status: 404, body: { error: "PARTICIPANT_NOT_FOUND" } };
    }
    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
