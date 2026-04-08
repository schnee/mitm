import { rankingResultsSchema } from "../../modules/ranking/validation";
import { RankingPreconditionError, type RankingService } from "../../modules/ranking/service";

export async function getRankedResultsHandler(
  payload: unknown,
  deps: { service: RankingService }
): Promise<{ status: number; body: unknown }> {
  const parsed = rankingResultsSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "INVALID_RANKING_REQUEST" } };
  }

  try {
    const result = await deps.service.generateRankedResults(parsed.data.sessionId);
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof RankingPreconditionError && error.code === "INPUTS_NOT_READY") {
      return { status: 409, body: { error: "INPUTS_NOT_READY" } };
    }
    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
