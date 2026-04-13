import type { RankedVenue } from "./ranking.js";

export interface SessionSnapshotParticipant {
  participantId: string;
  role: "host" | "invitee";
  joinedAt: string;
  locationDraftUpdatedAt: string | null;
  locationConfirmedAt: string | null;
  rankingInputsUpdatedAt: string | null;
  lat?: number;
  lng?: number;
}

export type SessionStatus = "created" | "joined" | "locating" | "ranked" | "confirmed" | "expired";

export type RankingLifecycleState = "waiting" | "generating" | "ready" | "failed";

export interface RankingLifecycleResponse {
  state: RankingLifecycleState;
  generatedAt?: string;
  lastErrorCode?: string | null;
  generationRequestId?: string | null;
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

export type VenueReactionType = "accept" | "pass";

export interface VenueReactionSummary {
  venueId: string;
  acceptCount: number;
  passCount: number;
  reactionsByParticipant: Record<string, VenueReactionType>;
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

export interface SessionSnapshotResponse {
  sessionId: string;
  status: SessionStatus;
  updatedAt: string;
  participants: SessionSnapshotParticipant[];
  inputsReady: boolean;
  rankingInputsReady: boolean;
  rankingLifecycle: RankingLifecycleResponse;
  rankedResults: RankedVenue[];
  shortlist: ShortlistVenue[];
  reactions: VenueReactionSummary[];
  confirmedPlace: ConfirmedPlace | null;
}

export interface SessionEventDiffResponse {
  status?: SessionStatus;
  inputsReady?: boolean;
  participantCount?: number;
  locationDraftUpdatedAt?: string;
  locationConfirmedAt?: string;
  rankingInputsUpdatedAt?: string;
  shortlist?: ShortlistVenue[];
  reactions?: VenueReactionSummary[];
  confirmedPlace?: ConfirmedPlace | null;
  rankingInputsReady?: boolean;
  rankingLifecycle?: RankingLifecycleResponse;
  rankedResults?: RankedVenue[];
}

export interface SessionEventResponse {
  eventType: "participant_joined" | "participant_location_confirmed" | "session_updated";
  sessionId: string;
  updatedAt: string;
  participantId?: string;
  participantRole?: "host" | "invitee";
  diff?: SessionEventDiffResponse;
}

export interface CreateSessionResponse {
  sessionId: string;
  joinUrl: string;
  participantId: string;
}

export interface JoinSessionResponse {
  sessionId: string;
  participantId: string;
}