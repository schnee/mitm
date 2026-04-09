import { randomUUID } from "node:crypto";
import type { RankedVenue } from "./contracts";
import type { RankingRepository } from "./repository";
import { scoreCandidates } from "./scoring";
import type { GoogleMapsAdapter } from "./provider/googleMapsAdapter";
import type { SessionRepository } from "../session/repository";

type Coordinates = { lat: number; lng: number };

export class RankingPreconditionError extends Error {
  constructor(public readonly code: "INPUTS_NOT_READY") {
    super(code);
  }
}

export type RankingGenerationMode = "auto" | "refresh";

export class RankingGenerationError extends Error {
  constructor(public readonly code: "GENERATION_FAILED", public readonly retryable: boolean = true) {
    super(code);
  }
}

export class RankingService {
  private inFlightBySessionId = new Map<
    string,
    Promise<{ sessionId: string; generatedAt: string; results: RankedVenue[]; mode: RankingGenerationMode }>
  >();

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly rankingRepository: RankingRepository,
    private readonly adapter: Pick<GoogleMapsAdapter, "searchCandidates" | "getTravelDurations">,
    private readonly radiusMeters: number = Number(process.env.GOOGLE_MAPS_PLACES_RADIUS_METERS ?? 2500)
  ) {}

  async generateSessionRankedResults(
    sessionId: string,
    mode: RankingGenerationMode = "refresh"
  ): Promise<{ sessionId: string; generatedAt: string; results: RankedVenue[]; mode: RankingGenerationMode }> {
    if (mode === "auto") {
      const lifecycle = this.sessionRepository.getRankingLifecycle(sessionId);
      const persisted = this.sessionRepository.getSessionRankedResults(sessionId);
      if (lifecycle.state === "ready" && persisted.length > 0) {
        return {
          sessionId,
          generatedAt: lifecycle.generatedAt ?? new Date().toISOString(),
          results: persisted,
          mode
        };
      }
    }

    const inFlight = this.inFlightBySessionId.get(sessionId);
    if (inFlight) {
      return inFlight;
    }

    const execution = this.executeGeneration(sessionId, mode);
    this.inFlightBySessionId.set(sessionId, execution);
    try {
      return await execution;
    } finally {
      this.inFlightBySessionId.delete(sessionId);
    }
  }

  async generateRankedResults(
    sessionId: string
  ): Promise<{ sessionId: string; generatedAt: string; results: RankedVenue[]; mode: RankingGenerationMode }> {
    return this.generateSessionRankedResults(sessionId, "refresh");
  }

  private async executeGeneration(
    sessionId: string,
    mode: RankingGenerationMode
  ): Promise<{ sessionId: string; generatedAt: string; results: RankedVenue[]; mode: RankingGenerationMode }> {
    const rankingInputsReady = this.sessionRepository.areBothRankingInputsSaved(sessionId);
    if (!rankingInputsReady) {
      throw new RankingPreconditionError("INPUTS_NOT_READY");
    }

    const requestId = randomUUID();
    const startTime = new Date();
    this.sessionRepository.setRankingLifecycle({
      sessionId,
      rankingInputsReady,
      patch: { state: "generating", lastErrorCode: null, generationRequestId: requestId },
      now: startTime
    });
    this.sessionRepository.recordFunnelEvent(
      sessionId,
      "ranking_generation_started",
      { mode, requestId },
      startTime
    );

    try {
      const generated = await this.computeRankedResults(sessionId);
      this.sessionRepository.upsertSessionRankedResults({
        sessionId,
        results: generated.results,
        generatedAt: generated.generatedAt,
        rankingInputsReady,
        generationRequestId: requestId,
        now: new Date(generated.generatedAt)
      });
      this.sessionRepository.recordFunnelEvent(
        sessionId,
        "ranking_generation_succeeded",
        { mode, requestId, resultCount: generated.results.length },
        new Date(generated.generatedAt)
      );
      this.sessionRepository.recordFunnelEvent(
        sessionId,
        "results_returned",
        { resultCount: generated.results.length, mode },
        new Date(generated.generatedAt)
      );

      return {
        sessionId,
        generatedAt: generated.generatedAt,
        results: this.sessionRepository.getSessionRankedResults(sessionId),
        mode
      };
    } catch (error) {
      if (error instanceof RankingPreconditionError) {
        throw error;
      }

      const failedAt = new Date();
      this.sessionRepository.setRankingLifecycle({
        sessionId,
        rankingInputsReady,
        patch: { state: "failed", lastErrorCode: "GENERATION_FAILED", generationRequestId: requestId },
        now: failedAt
      });
      this.sessionRepository.recordFunnelEvent(
        sessionId,
        "ranking_generation_failed",
        { mode, requestId, errorCode: "GENERATION_FAILED" },
        failedAt
      );

      throw new RankingGenerationError("GENERATION_FAILED");
    }
  }

  private async computeRankedResults(
    sessionId: string
  ): Promise<{ sessionId: string; generatedAt: string; results: RankedVenue[] }> {
    const participants = this.sessionRepository.getParticipants(sessionId).slice().sort((a, b) => a.role.localeCompare(b.role));
    if (participants.length !== 2) {
      throw new RankingPreconditionError("INPUTS_NOT_READY");
    }

    const [participantA, participantB] = participants;
    if (
      !participantA.locationConfirmedAt ||
      !participantB.locationConfirmedAt ||
      typeof participantA.lat !== "number" ||
      typeof participantA.lng !== "number" ||
      typeof participantB.lat !== "number" ||
      typeof participantB.lng !== "number"
    ) {
      throw new RankingPreconditionError("INPUTS_NOT_READY");
    }

    const rankingInputs = this.rankingRepository.getRankingInputsByRole(sessionId);
    if (!rankingInputs) {
      throw new RankingPreconditionError("INPUTS_NOT_READY");
    }

    const split = rankingInputs.host.split;
    const selectedTags = Array.from(new Set([...rankingInputs.host.tags, ...rankingInputs.invitee.tags]));
    const center = {
      lat: (participantA.lat + participantB.lat) / 2,
      lng: (participantA.lng + participantB.lng) / 2
    };

    const candidates = await this.adapter.searchCandidates(center, selectedTags, this.radiusMeters);
    const destinations = candidates.map((candidate) => ({ lat: candidate.lat, lng: candidate.lng }));
    const origins: Coordinates[] = [
      { lat: participantA.lat, lng: participantA.lng },
      { lat: participantB.lat, lng: participantB.lng }
    ];
    const durations = await this.adapter.getTravelDurations(origins, destinations);

    const scored = scoreCandidates(
      candidates.map((candidate, index) => ({
        ...candidate,
        etaParticipantA: durations[0]?.[index] ?? Number.POSITIVE_INFINITY,
        etaParticipantB: durations[1]?.[index] ?? Number.POSITIVE_INFINITY
      })),
      split,
      selectedTags
    );

    const results: RankedVenue[] = scored.slice(0, 10).map((candidate) => ({
      venueId: candidate.venueId,
      name: candidate.name,
      lat: candidate.lat,
      lng: candidate.lng,
      category: candidate.category,
      openNow: candidate.openNow,
      etaParticipantA: candidate.etaParticipantA,
      etaParticipantB: candidate.etaParticipantB,
      fairnessScore: candidate.fairnessScore,
      preferenceScore: candidate.preferenceScore,
      totalScore: candidate.totalScore,
      fairnessDeltaMinutes: Math.abs(candidate.etaParticipantA - candidate.etaParticipantB)
    }));

    const session = this.sessionRepository.getSessionById(sessionId);
    if (session && (session.status === "locating" || session.status === "ranked")) {
      this.sessionRepository.updateSessionStatus(sessionId, "ranked");
    }

    return {
      sessionId,
      generatedAt: new Date().toISOString(),
      results
    };
  }
}

export async function generateRankedResults(
  service: RankingService,
  sessionId: string
): Promise<{ sessionId: string; generatedAt: string; results: RankedVenue[]; mode: RankingGenerationMode }> {
  return service.generateSessionRankedResults(sessionId, "refresh");
}
