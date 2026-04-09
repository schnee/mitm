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

export class RankingService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly rankingRepository: RankingRepository,
    private readonly adapter: Pick<GoogleMapsAdapter, "searchCandidates" | "getTravelDurations">,
    private readonly radiusMeters: number = Number(process.env.GOOGLE_MAPS_PLACES_RADIUS_METERS ?? 2500)
  ) {}

  async generateRankedResults(sessionId: string): Promise<{ sessionId: string; generatedAt: string; results: RankedVenue[] }> {
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
      etaParticipantB: candidate.etaParticipantB
    }));

    const session = this.sessionRepository.getSessionById(sessionId);
    if (session && (session.status === "locating" || session.status === "ranked")) {
      this.sessionRepository.updateSessionStatus(sessionId, "ranked");
    }

    this.sessionRepository.recordFunnelEvent(sessionId, "results_returned", { resultCount: results.length });

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
): Promise<{ sessionId: string; generatedAt: string; results: RankedVenue[] }> {
  return service.generateRankedResults(sessionId);
}
