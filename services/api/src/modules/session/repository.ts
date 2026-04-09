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
  VenueReaction,
  VenueReactionSummary,
  VenueReactionType,
  SessionParticipantRole,
  SessionRecord,
  SessionSnapshot,
  SessionStatus,
  RankingLifecycle
} from "./contracts";
import type { RankedVenue } from "../ranking/contracts";
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
  private reactionsBySessionId = new Map<string, VenueReaction[]>();
  private confirmedPlaceBySessionId = new Map<string, ConfirmedPlace | null>();
  private rankingLifecycleBySessionId = new Map<string, RankingLifecycle>();
  private rankedResultsBySessionId = new Map<string, RankedVenue[]>();

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
    this.reactionsBySessionId.set(sessionId, []);
    this.confirmedPlaceBySessionId.set(sessionId, null);
    this.rankingLifecycleBySessionId.set(sessionId, { state: "waiting", lastErrorCode: null, generationRequestId: null });
    this.rankedResultsBySessionId.set(sessionId, []);
    this.eventsBySessionId.set(sessionId, [
      {
        eventType: "session_updated",
        sessionId,
        updatedAt: now.toISOString(),
        diff: { status: "created" }
      }
    ]);
    this.funnelEventsBySessionId.set(sessionId, []);
    this.recordFunnelEvent(sessionId, "session_start", { role: params.role }, now);

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

  areBothRankingInputsSaved(sessionId: string): boolean {
    const participants = this.getParticipants(sessionId);
    return participants.length === 2 && participants.every((item) => Boolean(item.rankingInputsUpdatedAt));
  }

  updateRankingOrchestrationState(params: {
    sessionId: string;
    rankingInputsReady: boolean;
    rankingLifecycle: RankingLifecycle;
    now?: Date;
  }): void {
    this.setRankingLifecycle({
      sessionId: params.sessionId,
      rankingInputsReady: params.rankingInputsReady,
      patch: params.rankingLifecycle,
      now: params.now
    });
  }

  setRankingLifecycle(params: {
    sessionId: string;
    rankingInputsReady?: boolean;
    patch: Partial<RankingLifecycle> & Pick<RankingLifecycle, "state">;
    now?: Date;
  }): RankingLifecycle {
    const session = this.getSessionById(params.sessionId);
    if (!session) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "No session found for id");
    }

    const current = this.getRankingLifecycle(params.sessionId);
    const updatedAt = (params.now ?? new Date()).toISOString();
    const nextGeneratedAt = params.patch.generatedAt ?? current.generatedAt;
    const nextLifecycle: RankingLifecycle = {
      state: params.patch.state,
      ...(nextGeneratedAt ? { generatedAt: nextGeneratedAt } : {}),
      lastErrorCode: params.patch.lastErrorCode ?? null,
      generationRequestId: params.patch.generationRequestId ?? null
    };
    this.rankingLifecycleBySessionId.set(params.sessionId, nextLifecycle);

    this.pushEvent({
      eventType: "session_updated",
      sessionId: params.sessionId,
      updatedAt,
      diff: {
        rankingInputsReady: params.rankingInputsReady ?? this.areBothRankingInputsSaved(params.sessionId),
        rankingLifecycle: this.getRankingLifecycle(params.sessionId)
      }
    });

    return this.getRankingLifecycle(params.sessionId);
  }

  upsertSessionRankedResults(params: {
    sessionId: string;
    results: RankedVenue[];
    generatedAt: string;
    rankingInputsReady?: boolean;
    generationRequestId?: string | null;
    now?: Date;
  }): RankedVenue[] {
    const session = this.getSessionById(params.sessionId);
    if (!session) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "No session found for id");
    }

    const updatedAt = (params.now ?? new Date()).toISOString();
    const nextResults = params.results.slice();
    this.rankedResultsBySessionId.set(params.sessionId, nextResults);
    this.rankingLifecycleBySessionId.set(params.sessionId, {
      state: "ready",
      generatedAt: params.generatedAt,
      lastErrorCode: null,
      generationRequestId: params.generationRequestId ?? null
    });

    this.pushEvent({
      eventType: "session_updated",
      sessionId: params.sessionId,
      updatedAt,
      diff: {
        rankingInputsReady: params.rankingInputsReady ?? this.areBothRankingInputsSaved(params.sessionId),
        rankingLifecycle: this.getRankingLifecycle(params.sessionId),
        rankedResults: this.getSessionRankedResults(params.sessionId)
      }
    });

    return this.getSessionRankedResults(params.sessionId);
  }

  getRankingLifecycle(sessionId: string): RankingLifecycle {
    const current = this.rankingLifecycleBySessionId.get(sessionId);
    if (current) {
      return { ...current };
    }
    return { state: "waiting", lastErrorCode: null, generationRequestId: null };
  }

  getSessionRankedResults(sessionId: string): RankedVenue[] {
    return (this.rankedResultsBySessionId.get(sessionId) ?? []).slice();
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
    const wasEmpty = shortlist.length === 0;
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

    if (wasEmpty) {
      this.recordFunnelEvent(params.sessionId, "shortlist_opened", { venueId: params.venueId }, new Date(addedAt));
    }

    const firstReaction = this.getFirstReactionForVenue(params.sessionId, params.venueId);
    if (firstReaction && !this.hasReactionToShortlistEventForVenue(params.sessionId, params.venueId)) {
      const reactionToShortlistSeconds = Math.max(
        0,
        Math.round((new Date(addedAt).getTime() - new Date(firstReaction.reactedAt).getTime()) / 1000)
      );
      this.recordFunnelEvent(
        params.sessionId,
        "reaction_to_shortlist",
        { venueId: params.venueId, reactionToShortlistSeconds },
        new Date(addedAt)
      );
    }

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

  upsertVenueReaction(params: {
    sessionId: string;
    venueId: string;
    participantId: string;
    reaction: VenueReactionType;
    now?: Date;
  }): VenueReactionSummary {
    const participant = this.getParticipant(params.sessionId, params.participantId);
    if (!participant) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "Participant not found in session");
    }

    const reactedAt = (params.now ?? new Date()).toISOString();
    const reactions = this.reactionsBySessionId.get(params.sessionId) ?? [];
    const existingIndex = reactions.findIndex(
      (item) => item.venueId === params.venueId && item.participantId === params.participantId
    );

    const nextReaction: VenueReaction = {
      sessionId: params.sessionId,
      venueId: params.venueId,
      participantId: params.participantId,
      reaction: params.reaction,
      reactedAt
    };

    if (existingIndex >= 0) {
      reactions[existingIndex] = nextReaction;
    } else {
      reactions.push(nextReaction);
    }

    this.reactionsBySessionId.set(params.sessionId, reactions);
    this.recordFunnelEvent(
      params.sessionId,
      "result_reacted",
      { venueId: params.venueId, reaction: params.reaction },
      new Date(reactedAt)
    );

    const isShortlisted = (this.shortlistBySessionId.get(params.sessionId) ?? []).some(
      (item) => item.venueId === params.venueId
    );
    const firstReaction = this.getFirstReactionForVenue(params.sessionId, params.venueId);
    if (isShortlisted && firstReaction && !this.hasReactionToShortlistEventForVenue(params.sessionId, params.venueId)) {
      const reactionToShortlistSeconds = Math.max(
        0,
        Math.round((new Date(reactedAt).getTime() - new Date(firstReaction.reactedAt).getTime()) / 1000)
      );
      this.recordFunnelEvent(
        params.sessionId,
        "reaction_to_shortlist",
        { venueId: params.venueId, reactionToShortlistSeconds },
        new Date(reactedAt)
      );
    }

    const aggregate = this.getVenueReactionSummary(params.sessionId, params.venueId);
    this.pushEvent({
      eventType: "session_updated",
      sessionId: params.sessionId,
      updatedAt: reactedAt,
      participantId: participant.participantId,
      participantRole: participant.role,
      diff: { reactions: this.getReactionSummaries(params.sessionId) }
    });

    return aggregate;
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
    metadata?: Record<string, string | number | boolean | null>,
    occurredAt?: Date
  ): void {
    const session = this.getSessionById(sessionId);
    if (!session) {
      throw new SessionDomainError("SESSION_NOT_FOUND", "No session found for id");
    }

    const events = this.funnelEventsBySessionId.get(sessionId) ?? [];
    if (
      (event === "inputs_set" || event === "decision_confirmed" || event === "ranking_results_rendered") &&
      events.some((item) => item.event === event)
    ) {
      return;
    }

    events.push({
      sessionId,
      event,
      occurredAt: (occurredAt ?? new Date()).toISOString(),
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
      rankingInputsReady: this.areBothRankingInputsSaved(sessionId),
      rankingLifecycle: this.getRankingLifecycle(sessionId),
      rankedResults: this.getSessionRankedResults(sessionId),
      shortlist: (this.shortlistBySessionId.get(sessionId) ?? []).slice(),
      reactions: this.getReactionSummaries(sessionId),
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
    this.reactionsBySessionId.set(overrides.sessionId, []);
    this.confirmedPlaceBySessionId.set(overrides.sessionId, null);
    this.rankingLifecycleBySessionId.set(overrides.sessionId, {
      state: "waiting",
      lastErrorCode: null,
      generationRequestId: null
    });
    this.rankedResultsBySessionId.set(overrides.sessionId, []);
  }

  private getReactionSummaries(sessionId: string): VenueReactionSummary[] {
    const reactions = this.reactionsBySessionId.get(sessionId) ?? [];
    const byVenueId = new Map<string, VenueReactionSummary>();

    for (const reaction of reactions) {
      const current = byVenueId.get(reaction.venueId) ?? {
        venueId: reaction.venueId,
        acceptCount: 0,
        passCount: 0,
        reactionsByParticipant: {}
      };
      current.reactionsByParticipant[reaction.participantId] = reaction.reaction;
      byVenueId.set(reaction.venueId, current);
    }

    for (const summary of byVenueId.values()) {
      const values = Object.values(summary.reactionsByParticipant);
      summary.acceptCount = values.filter((value) => value === "accept").length;
      summary.passCount = values.filter((value) => value === "pass").length;
    }

    return Array.from(byVenueId.values()).sort((a, b) => a.venueId.localeCompare(b.venueId));
  }

  private getVenueReactionSummary(sessionId: string, venueId: string): VenueReactionSummary {
    return (
      this.getReactionSummaries(sessionId).find((item) => item.venueId === venueId) ?? {
        venueId,
        acceptCount: 0,
        passCount: 0,
        reactionsByParticipant: {}
      }
    );
  }

  private getFirstReactionForVenue(sessionId: string, venueId: string): VenueReaction | undefined {
    return (this.reactionsBySessionId.get(sessionId) ?? [])
      .filter((item) => item.venueId === venueId)
      .sort((a, b) => a.reactedAt.localeCompare(b.reactedAt))[0];
  }

  private hasReactionToShortlistEventForVenue(sessionId: string, venueId: string): boolean {
    return (this.funnelEventsBySessionId.get(sessionId) ?? []).some(
      (item) => item.event === "reaction_to_shortlist" && item.metadata?.venueId === venueId
    );
  }
}
