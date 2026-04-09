import type { RankingInputState } from "./contracts";
import type { RankingLifecycle } from "../session/contracts";
import { SessionDomainError, type SessionRepository } from "../session/repository";

export interface RankingInputsByRole {
  host: RankingInputState;
  invitee: RankingInputState;
}

export class RankingRepository {
  constructor(private readonly sessionRepository: SessionRepository) {}

  upsertRankingInputs(input: {
    sessionId: string;
    participantId: string;
    split: RankingInputState["split"];
    tags: RankingInputState["tags"];
  }): RankingInputState & { rankingInputsReady: boolean; rankingLifecycle: RankingLifecycle } {
    const participant = this.sessionRepository.getParticipant(input.sessionId, input.participantId);
    if (!participant) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "Participant not found in session");
    }

    const now = new Date();
    const updatedAt = now.toISOString();
    participant.willingnessSplit = input.split;
    participant.preferenceTags = input.tags;
    participant.rankingInputsUpdatedAt = updatedAt;
    this.sessionRepository.recordFunnelEvent(
      input.sessionId,
      "ranking_inputs_saved",
      { participantId: input.participantId, split: input.split },
      now
    );

    const rankingInputsReady = this.sessionRepository.areBothRankingInputsSaved(input.sessionId);
    const rankingLifecycle: RankingLifecycle = {
      state: rankingInputsReady ? "generating" : "waiting",
      lastErrorCode: null,
      generationRequestId: null
    };
    if (!rankingInputsReady) {
      this.sessionRepository.recordFunnelEvent(input.sessionId, "ranking_waiting_for_partner", undefined, now);
    }
    this.sessionRepository.updateRankingOrchestrationState({
      sessionId: input.sessionId,
      rankingInputsReady,
      rankingLifecycle,
      now
    });

    return {
      split: input.split,
      tags: input.tags,
      updatedAt,
      rankingInputsReady,
      rankingLifecycle
    };
  }

  getSessionRankingOrchestrationState(sessionId: string): {
    rankingInputsReady: boolean;
    rankingLifecycle: RankingLifecycle;
  } {
    return {
      rankingInputsReady: this.sessionRepository.areBothRankingInputsSaved(sessionId),
      rankingLifecycle: this.sessionRepository.getRankingLifecycle(sessionId)
    };
  }

  getRankingInputsByRole(sessionId: string): RankingInputsByRole | null {
    const participants = this.sessionRepository.getParticipants(sessionId);
    if (participants.length !== 2) {
      return null;
    }

    const host = participants.find((participant) => participant.role === "host");
    const invitee = participants.find((participant) => participant.role === "invitee");
    if (!host || !invitee) {
      return null;
    }

    if (!host.willingnessSplit || !host.preferenceTags || !host.rankingInputsUpdatedAt) {
      return null;
    }

    if (!invitee.willingnessSplit || !invitee.preferenceTags || !invitee.rankingInputsUpdatedAt) {
      return null;
    }

    return {
      host: {
        split: host.willingnessSplit,
        tags: host.preferenceTags,
        updatedAt: host.rankingInputsUpdatedAt
      },
      invitee: {
        split: invitee.willingnessSplit,
        tags: invitee.preferenceTags,
        updatedAt: invitee.rankingInputsUpdatedAt
      }
    };
  }
}
