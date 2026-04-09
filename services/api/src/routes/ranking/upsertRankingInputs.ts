import type { RankingRepository } from "../../modules/ranking/repository";
import { RankingGenerationError, RankingPreconditionError, type RankingService } from "../../modules/ranking/service";
import { rankingInputsSchema } from "../../modules/ranking/validation";
import { SessionDomainError } from "../../modules/session/repository";

export async function upsertRankingInputsHandler(
  payload: unknown,
  deps: { repository: RankingRepository; service?: RankingService }
): Promise<{ status: number; body: unknown }> {
  const parsed = rankingInputsSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: "INVALID_RANKING_INPUTS" } };
  }

  try {
    const result = deps.repository.upsertRankingInputs(parsed.data);
    let autoGenerationError: string | null = null;

    if (result.rankingInputsReady && deps.service) {
      try {
        await deps.service.generateSessionRankedResults(parsed.data.sessionId, "auto");
      } catch (error) {
        if (error instanceof RankingPreconditionError && error.code === "INPUTS_NOT_READY") {
          autoGenerationError = "INPUTS_NOT_READY";
        } else if (error instanceof RankingGenerationError) {
          autoGenerationError = error.code;
        } else {
          autoGenerationError = "UNEXPECTED_ERROR";
        }
      }
    }

    const orchestration = deps.repository.getSessionRankingOrchestrationState(parsed.data.sessionId);
    return {
      status: 200,
      body: {
        split: result.split,
        tags: result.tags,
        updatedAt: result.updatedAt,
        rankingInputsReady: orchestration.rankingInputsReady,
        rankingLifecycle: orchestration.rankingLifecycle,
        ...(autoGenerationError ? { autoGenerationError } : {})
      }
    };
  } catch (error) {
    if (error instanceof SessionDomainError) {
      return { status: 404, body: { error: "PARTICIPANT_NOT_FOUND" } };
    }
    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
