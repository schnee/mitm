import { rankingResultsSchema } from "../../modules/ranking/validation";
import {
  RankingGenerationError,
  RankingPreconditionError,
  type RankingService
} from "../../modules/ranking/service";

export async function getRankedResultsHandler(
  payload: unknown,
  deps: { service: RankingService }
): Promise<{ status: number; body: unknown }> {
  const parsed = rankingResultsSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "INVALID_RANKING_REQUEST" } };
  }

  try {
    const result = await deps.service.generateSessionRankedResults(parsed.data.sessionId, "refresh");
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof RankingPreconditionError && error.code === "INPUTS_NOT_READY") {
      return { status: 409, body: { error: "INPUTS_NOT_READY" } };
    }
    if (error instanceof RankingGenerationError) {
      return {
        status: 503,
        body: {
          error: "RANKING_GENERATION_FAILED",
          retryable: error.retryable,
          message: "Saved locations and meet-up preferences are preserved. Retry with Refresh suggestions."
        }
      };
    }
    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
