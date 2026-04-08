import type { LocationRepository } from "../../modules/location/repository";
import { locationConfirmSchema } from "../../modules/location/validation";
import { SessionDomainError } from "../../modules/session/repository";

export async function confirmLocationHandler(
  payload: unknown,
  deps: { repository: LocationRepository }
): Promise<{ status: number; body: unknown }> {
  const parsed = locationConfirmSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "INVALID_CONFIRM_LOCATION_PAYLOAD" } };
  }

  try {
    const result = deps.repository.confirmLocation(parsed.data);
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof SessionDomainError) {
      return { status: 409, body: { error: "LOCATION_DRAFT_REQUIRED" } };
    }

    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
