import type { RankingInputState } from "./contracts";
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
  }): RankingInputState {
    const participant = this.sessionRepository.getParticipant(input.sessionId, input.participantId);
    if (!participant) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "Participant not found in session");
    }

    const updatedAt = new Date().toISOString();
    participant.willingnessSplit = input.split;
    participant.preferenceTags = input.tags;
    participant.rankingInputsUpdatedAt = updatedAt;

    return {
      split: input.split,
      tags: input.tags,
      updatedAt
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
