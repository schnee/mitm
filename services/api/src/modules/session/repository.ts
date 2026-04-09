import { randomUUID } from "node:crypto";
import type {
  ConfirmedPlace,
  CreateSessionResult,
  FunnelEventName,
  FunnelEventRecord,
  SessionEvent,
  JoinSessionResult,
  ParticipantRecord,
  ShortlistVenue,
  SessionParticipantRole,
  SessionRecord,
  SessionSnapshot,
  SessionStatus
} from "./contracts";
import { assertValidTransition } from "./state-machine";

type SessionErrorCode =
  | "SESSION_NOT_FOUND"
  | "SESSION_FULL"
  | "SESSION_EXPIRED"
  | "PLACE_ALREADY_CONFIRMED"
  | "VENUE_NOT_SHORTLISTED";

export class SessionDomainError extends Error {
  code: SessionErrorCode;

  constructor(code: SessionErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type CreateSessionParams = {
  joinToken: string;
  role: SessionParticipantRole;
  now?: Date;
  expiresAt?: Date;
};

type JoinSessionParams = {
  joinToken: string;
  role: SessionParticipantRole;
  now?: Date;
};

export class SessionRepository {
  private sessions = new Map<string, SessionRecord>();
  private participantsBySessionId = new Map<string, ParticipantRecord[]>();
  private sessionIdByToken = new Map<string, string>();
  private eventsBySessionId = new Map<string, SessionEvent[]>();
  private funnelEventsBySessionId = new Map<string, FunnelEventRecord[]>();
  private shortlistBySessionId = new Map<string, ShortlistVenue[]>();
  private confirmedPlaceBySessionId = new Map<string, ConfirmedPlace | null>();

  createSession(params: CreateSessionParams): CreateSessionResult {
    const now = params.now ?? new Date();
    const expiresAt = params.expiresAt ?? new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const sessionId = randomUUID();
    const participantId = randomUUID();

    const session: SessionRecord = {
      sessionId,
      joinToken: params.joinToken,
      status: "created",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    const hostParticipant: ParticipantRecord = {
      participantId,
      sessionId,
      role: params.role,
      joinedAt: now.toISOString(),
      accountId: null
    };

    this.sessions.set(sessionId, session);
    this.sessionIdByToken.set(params.joinToken, sessionId);
    this.participantsBySessionId.set(sessionId, [hostParticipant]);
    this.shortlistBySessionId.set(sessionId, []);
    this.confirmedPlaceBySessionId.set(sessionId, null);
    this.eventsBySessionId.set(sessionId, [
      {
        eventType: "session_updated",
        sessionId,
        updatedAt: now.toISOString(),
        diff: { status: "created" }
      }
    ]);
    this.funnelEventsBySessionId.set(sessionId, []);
    this.recordFunnelEvent(sessionId, "session_start", { role: params.role });

    return {
      sessionId,
      joinToken: params.joinToken,
      participantId
    };
  }

  joinSession(params: JoinSessionParams): JoinSessionResult {
    const now = params.now ?? new Date();
    const sessionId = this.sessionIdByToken.get(params.joinToken);

    if (!sessionId) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "No session found for token");
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "No session found for token");
    }

    if (new Date(session.expiresAt).getTime() <= now.getTime()) {
      session.status = "expired";
      session.updatedAt = now.toISOString();
      this.sessions.set(sessionId, session);
      throw new SessionDomainError("SESSION_EXPIRED", "Session expired");
    }

    const participants = this.participantsBySessionId.get(sessionId) ?? [];
    if (participants.length >= 2) {
      throw new SessionDomainError("SESSION_FULL", "Session already has two participants");
    }

    const participantId = randomUUID();
    const invitee: ParticipantRecord = {
      participantId,
      sessionId,
      role: params.role,
      joinedAt: now.toISOString(),
      accountId: null
    };

    participants.push(invitee);
    this.participantsBySessionId.set(sessionId, participants);
    this.updateSessionStatus(sessionId, "joined", now);
    this.pushEvent({
      eventType: "participant_joined",
      sessionId,
      updatedAt: now.toISOString(),
      participantId,
      participantRole: params.role,
      diff: { participantCount: participants.length }
    });

    return {
      sessionId,
      participantId
    };
  }

  getSessionById(sessionId: string): SessionRecord | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionByToken(joinToken: string): SessionRecord | undefined {
    const sessionId = this.sessionIdByToken.get(joinToken);
    if (!sessionId) {
      return undefined;
    }
    return this.getSessionById(sessionId);
  }

  getParticipants(sessionId: string): ParticipantRecord[] {
    return this.participantsBySessionId.get(sessionId) ?? [];
  }

  getParticipant(sessionId: string, participantId: string): ParticipantRecord | undefined {
    return this.getParticipants(sessionId).find((item) => item.participantId === participantId);
  }

  updateSessionStatus(sessionId: string, nextStatus: SessionStatus, now: Date = new Date()): SessionRecord {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "No session found for id");
    }

    assertValidTransition(session.status, nextStatus);
    session.status = nextStatus;
    session.updatedAt = now.toISOString();
    this.sessions.set(sessionId, session);
    this.pushEvent({
      eventType: "session_updated",
      sessionId,
      updatedAt: now.toISOString(),
      diff: { status: nextStatus, inputsReady: this.areBothLocationsConfirmed(sessionId) }
    });
    return session;
  }

  upsertParticipantLocationDraft(params: {
    sessionId: string;
    participantId: string;
    mode: "geolocation" | "manual";
    lat: number;
    lng: number;
    addressLabel: string;
    updatedAt?: Date;
    expireAt?: Date;
  }): ParticipantRecord {
    const participant = this.getParticipant(params.sessionId, params.participantId);
    if (!participant) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "Participant not found in session");
    }

    const updatedAt = (params.updatedAt ?? new Date()).toISOString();
    participant.locationMode = params.mode;
    participant.lat = params.lat;
    participant.lng = params.lng;
    participant.addressLabel = params.addressLabel;
    participant.locationDraftUpdatedAt = updatedAt;
    participant.locationExpireAt = (params.expireAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000)).toISOString();

    this.pushEvent({
      eventType: "session_updated",
      sessionId: params.sessionId,
      updatedAt,
      participantId: participant.participantId,
      participantRole: participant.role,
      diff: { locationDraftUpdatedAt: updatedAt }
    });

    return participant;
  }

  confirmParticipantLocation(params: {
    sessionId: string;
    participantId: string;
    now?: Date;
  }): ParticipantRecord {
    const participant = this.getParticipant(params.sessionId, params.participantId);
    if (!participant) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "Participant not found in session");
    }

    if (!participant.locationDraftUpdatedAt) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "Location draft is required before confirm");
    }

    const timestamp = (params.now ?? new Date()).toISOString();
    participant.locationConfirmedAt = timestamp;
    this.pushEvent({
      eventType: "participant_location_confirmed",
      sessionId: params.sessionId,
      updatedAt: timestamp,
      participantId: participant.participantId,
      participantRole: participant.role,
      diff: { locationConfirmedAt: timestamp }
    });

    if (this.areBothLocationsConfirmed(params.sessionId)) {
      const session = this.getSessionById(params.sessionId);
      if (session && session.status === "joined") {
        this.updateSessionStatus(params.sessionId, "locating", new Date(timestamp));
      }
    }

    return participant;
  }

  areBothLocationsConfirmed(sessionId: string): boolean {
    const participants = this.getParticipants(sessionId);
    return participants.length === 2 && participants.every((item) => Boolean(item.locationConfirmedAt));
  }

  upsertShortlistVenue(params: {
    sessionId: string;
    participantId: string;
    venueId: string;
    name: string;
    category: string;
    openNow: boolean | null;
    lat: number;
    lng: number;
    etaParticipantA: number;
    etaParticipantB: number;
    now?: Date;
  }): ShortlistVenue[] {
    const participant = this.getParticipant(params.sessionId, params.participantId);
    if (!participant) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "Participant not found in session");
    }

    const addedAt = (params.now ?? new Date()).toISOString();
    const shortlist = this.shortlistBySessionId.get(params.sessionId) ?? [];
    const nextEntry: ShortlistVenue = {
      venueId: params.venueId,
      name: params.name,
      category: params.category,
      openNow: params.openNow,
      lat: params.lat,
      lng: params.lng,
      etaParticipantA: params.etaParticipantA,
      etaParticipantB: params.etaParticipantB,
      addedByParticipantId: participant.participantId,
      addedAt
    };

    const existingIndex = shortlist.findIndex((item) => item.venueId === params.venueId);
    if (existingIndex >= 0) {
      shortlist[existingIndex] = nextEntry;
    } else {
      shortlist.push(nextEntry);
    }

    this.shortlistBySessionId.set(params.sessionId, shortlist);
    this.pushEvent({
      eventType: "session_updated",
      sessionId: params.sessionId,
      updatedAt: addedAt,
      participantId: participant.participantId,
      participantRole: participant.role,
      diff: { shortlist }
    });

    return shortlist;
  }

  confirmVenue(params: {
    sessionId: string;
    participantId: string;
    venueId: string;
    now?: Date;
  }): ConfirmedPlace {
    const participant = this.getParticipant(params.sessionId, params.participantId);
    if (!participant) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "Participant not found in session");
    }

    const shortlisted = (this.shortlistBySessionId.get(params.sessionId) ?? []).find(
      (item) => item.venueId === params.venueId
    );
    if (!shortlisted) {
      throw new SessionDomainError("VENUE_NOT_SHORTLISTED", "Venue must be shortlisted before confirmation");
    }

    const existingConfirmedPlace = this.confirmedPlaceBySessionId.get(params.sessionId) ?? null;
    if (existingConfirmedPlace) {
      if (existingConfirmedPlace.venueId === params.venueId) {
        return existingConfirmedPlace;
      }
      throw new SessionDomainError("PLACE_ALREADY_CONFIRMED", "A different place is already confirmed");
    }

    const confirmedAt = (params.now ?? new Date()).toISOString();
    const confirmedPlace: ConfirmedPlace = {
      venueId: shortlisted.venueId,
      name: shortlisted.name,
      category: shortlisted.category,
      lat: shortlisted.lat,
      lng: shortlisted.lng,
      navigationUrl: `https://www.google.com/maps/search/?api=1&query=${shortlisted.lat},${shortlisted.lng}`,
      confirmedByParticipantId: participant.participantId,
      confirmedAt
    };

    this.confirmedPlaceBySessionId.set(params.sessionId, confirmedPlace);
    this.updateSessionStatus(params.sessionId, "confirmed", new Date(confirmedAt));
    this.pushEvent({
      eventType: "session_updated",
      sessionId: params.sessionId,
      updatedAt: confirmedAt,
      participantId: participant.participantId,
      participantRole: participant.role,
      diff: { confirmedPlace }
    });
    this.recordFunnelEvent(params.sessionId, "decision_confirmed", { venueId: params.venueId });

    return confirmedPlace;
  }

  recordFunnelEvent(
    sessionId: string,
    event: FunnelEventName,
    metadata?: Record<string, string | number | boolean | null>
  ): void {
    const session = this.getSessionById(sessionId);
    if (!session) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "No session found for id");
    }

    const events = this.funnelEventsBySessionId.get(sessionId) ?? [];
    if ((event === "inputs_set" || event === "decision_confirmed") && events.some((item) => item.event === event)) {
      return;
    }

    events.push({
      sessionId,
      event,
      occurredAt: new Date().toISOString(),
      ...(metadata ? { metadata } : {})
    });
    this.funnelEventsBySessionId.set(sessionId, events);
  }

  listFunnelEvents(sessionId: string): FunnelEventRecord[] {
    const session = this.getSessionById(sessionId);
    if (!session) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "No session found for id");
    }
    return (this.funnelEventsBySessionId.get(sessionId) ?? []).slice();
  }

  getSessionSnapshot(sessionId: string): SessionSnapshot | undefined {
    const session = this.getSessionById(sessionId);
    if (!session) {
      return undefined;
    }
    const participants = this.getParticipants(sessionId)
      .slice()
      .sort((a, b) => a.role.localeCompare(b.role))
      .map((item) => ({
        participantId: item.participantId,
        role: item.role,
        joinedAt: item.joinedAt,
        locationConfirmedAt: item.locationConfirmedAt ?? null
      }));
    return {
      sessionId,
      status: session.status,
      updatedAt: session.updatedAt,
      participants,
      inputsReady: this.areBothLocationsConfirmed(sessionId),
      shortlist: (this.shortlistBySessionId.get(sessionId) ?? []).slice(),
      confirmedPlace: this.confirmedPlaceBySessionId.get(sessionId) ?? null
    };
  }

  listSessionEvents(sessionId: string, since?: string): SessionEvent[] {
    const events = this.eventsBySessionId.get(sessionId) ?? [];
    if (!since) {
      return events.slice();
    }
    return events.filter((item) => item.updatedAt > since);
  }

  private pushEvent(event: SessionEvent): void {
    const events = this.eventsBySessionId.get(event.sessionId) ?? [];
    events.push(event);
    this.eventsBySessionId.set(event.sessionId, events);
  }

  seedSession(overrides: Partial<SessionRecord> & Pick<SessionRecord, "sessionId" | "joinToken">): void {
    const now = new Date().toISOString();
    this.sessions.set(overrides.sessionId, {
      sessionId: overrides.sessionId,
      joinToken: overrides.joinToken,
      status: (overrides.status as SessionStatus | undefined) ?? "created",
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 30_000).toISOString()
    });
    this.sessionIdByToken.set(overrides.joinToken, overrides.sessionId);
    this.eventsBySessionId.set(overrides.sessionId, []);
    this.funnelEventsBySessionId.set(overrides.sessionId, []);
    this.shortlistBySessionId.set(overrides.sessionId, []);
    this.confirmedPlaceBySessionId.set(overrides.sessionId, null);
  }
}
