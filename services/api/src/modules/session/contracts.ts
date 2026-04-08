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
  locationConfirmedAt: string | null;
}

export interface SessionSnapshot {
  sessionId: string;
  status: SessionStatus;
  updatedAt: string;
  participants: SessionSnapshotParticipant[];
  inputsReady: boolean;
}

export type SessionEventType =
  | "participant_joined"
  | "participant_location_confirmed"
  | "session_updated";

export interface SessionEvent {
  eventType: SessionEventType;
  sessionId: string;
  updatedAt: string;
  participantId?: string;
  participantRole?: SessionParticipantRole;
  diff?: Record<string, unknown>;
}
