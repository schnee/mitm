import { SessionDomainError, type SessionRepository } from "../session/repository";

export interface LocationDraftInput {
  mode: "geolocation" | "manual";
  sessionId: string;
  participantId: string;
  lat: number;
  lng: number;
  addressLabel: string;
}

export class LocationRepository {
  constructor(private readonly sessionRepository: SessionRepository) {}

  upsertLocationDraft(input: LocationDraftInput): { expireAt: string } {
    const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    this.sessionRepository.upsertParticipantLocationDraft({
      sessionId: input.sessionId,
      participantId: input.participantId,
      mode: input.mode,
      lat: input.lat,
      lng: input.lng,
      addressLabel: input.addressLabel,
      expireAt
    });
    return { expireAt: expireAt.toISOString() };
  }

  confirmLocation(input: { sessionId: string; participantId: string }): { confirmedAt: string; inputsReady: boolean } {
    const participant = this.sessionRepository.confirmParticipantLocation({
      sessionId: input.sessionId,
      participantId: input.participantId
    });

    if (!participant.locationConfirmedAt) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "Confirmation failed");
    }

    return {
      confirmedAt: participant.locationConfirmedAt,
      inputsReady: this.sessionRepository.areBothLocationsConfirmed(input.sessionId)
    };
  }
}
