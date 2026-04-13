import type { RankedVenue } from "../ranking/contracts";

export type SessionStatus = "created" | "joined" | "locating" | "ranked" | "confirmed" | "expired";

export type SessionParticipantRole = "host" | "invitee";

export interface SessionRecord {
  sessionId: string;
  joinToken: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface ParticipantRecord {
  participantId: string;
  sessionId: string;
  role: SessionParticipantRole;
  joinedAt: string;
  accountId: string | null;
  locationMode?: "geolocation" | "manual";
  lat?: number;
  lng?: number;
  addressLabel?: string;
  locationDraftUpdatedAt?: string;
  locationConfirmedAt?: string;
  locationExpireAt?: string;
  willingnessSplit?: string;
  preferenceTags?: Array<"coffee" | "lunch" | "dinner" | "cocktails" | "dessert" | "museum" | "walk_and_talk" | "vintage_shops" | "quiet">;
  rankingInputsUpdatedAt?: string;
}

export interface CreateSessionInput {
  hostName?: string;
  role: SessionParticipantRole;
}

export interface JoinSessionInput {
  joinToken: string;
  role: SessionParticipantRole;
}

export interface CreateSessionResult {
  sessionId: string;
  joinToken: string;
  participantId: string;
}

export interface JoinSessionResult {
  sessionId: string;
  participantId: string;
}

export interface SessionSnapshotParticipant {
  participantId: string;
  role: SessionParticipantRole;
  joinedAt: string;
  locationDraftUpdatedAt: string | null;
  locationConfirmedAt: string | null;
  rankingInputsUpdatedAt: string | null;
}

export interface ShortlistVenue {
  venueId: string;
  name: string;
  category: string;
  openNow: boolean | null;
  lat: number;
  lng: number;
  etaParticipantA: number;
  etaParticipantB: number;
  addedByParticipantId: string;
  addedAt: string;
}

export interface ConfirmedPlace {
  venueId: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  navigationUrl: string;
  confirmedByParticipantId: string;
  confirmedAt: string;
}

export type VenueReactionType = "accept" | "pass";

export interface VenueReaction {
  sessionId: string;
  venueId: string;
  participantId: string;
  reaction: VenueReactionType;
  reactedAt: string;
}

export interface VenueReactionSummary {
  venueId: string;
  acceptCount: number;
  passCount: number;
  reactionsByParticipant: Record<string, VenueReactionType>;
}

export interface SessionSnapshot {
  sessionId: string;
  status: SessionStatus;
  updatedAt: string;
  participants: SessionSnapshotParticipant[];
  inputsReady: boolean;
  rankingInputsReady: boolean;
  rankingLifecycle: RankingLifecycle;
  rankedResults: RankedVenue[];
  shortlist: ShortlistVenue[];
  reactions: VenueReactionSummary[];
  confirmedPlace: ConfirmedPlace | null;
}

export type RankingLifecycleState = "waiting" | "generating" | "ready" | "failed";

export interface RankingLifecycle {
  state: RankingLifecycleState;
  generatedAt?: string;
  lastErrorCode?: string | null;
  generationRequestId?: string | null;
}

export type FunnelEventName =
  | "session_start"
  | "inputs_set"
  | "results_returned"
  | "decision_confirmed"
  | "result_reacted"
  | "shortlist_opened"
  | "reaction_to_shortlist"
  | "ranking_inputs_saved"
  | "ranking_waiting_for_partner"
  | "ranking_generation_started"
  | "ranking_generation_succeeded"
  | "ranking_generation_failed"
  | "ranking_results_rendered";

export type FunnelEventMetadataValue = string | number | boolean | null;

export interface FunnelEventRecord {
  sessionId: string;
  event: FunnelEventName;
  occurredAt: string;
  metadata?: Record<string, FunnelEventMetadataValue>;
}

export type SessionEventType =
  | "participant_joined"
  | "participant_location_confirmed"
  | "session_updated";

export interface SessionEventDiff {
  status?: SessionStatus;
  inputsReady?: boolean;
  participantCount?: number;
  locationDraftUpdatedAt?: string;
  locationConfirmedAt?: string;
  shortlist?: ShortlistVenue[];
  reactions?: VenueReactionSummary[];
  confirmedPlace?: ConfirmedPlace | null;
  rankingInputsReady?: boolean;
  rankingLifecycle?: RankingLifecycle;
  rankedResults?: RankedVenue[];
}

export interface SessionEvent {
  eventType: SessionEventType;
  sessionId: string;
  updatedAt: string;
  participantId?: string;
  participantRole?: SessionParticipantRole;
  diff?: SessionEventDiff;
}
