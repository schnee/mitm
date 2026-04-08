import type { RankingRepository } from "../../modules/ranking/repository";
import { rankingInputsSchema } from "../../modules/ranking/validation";
import { SessionDomainError } from "../../modules/session/repository";

export async function upsertRankingInputsHandler(
  payload: unknown,
  deps: { repository: RankingRepository }
): Promise<{ status: number; body: unknown }> {
  const parsed = rankingInputsSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "INVALID_RANKING_INPUTS" } };
  }

  try {
    const result = deps.repository.upsertRankingInputs(parsed.data);
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof SessionDomainError) {
      return { status: 404, body: { error: "PARTICIPANT_NOT_FOUND" } };
    }
    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
