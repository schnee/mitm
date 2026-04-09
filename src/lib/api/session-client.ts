const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

interface CreateSessionResponse {
  sessionId: string;
  joinUrl: string;
  participantId: string;
}

interface JoinSessionResponse {
  sessionId: string;
  participantId: string;
}

export interface SessionSnapshotParticipant {
  participantId: string;
  role: "host" | "invitee";
  joinedAt: string;
  locationConfirmedAt: string | null;
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

export interface VenueReactionSummary {
  venueId: string;
  acceptCount: number;
  passCount: number;
  reactionsByParticipant: Record<string, VenueReactionType>;
}

export interface SessionSnapshotResponse {
  sessionId: string;
  status: "created" | "joined" | "locating" | "ranked" | "confirmed" | "expired";
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

export type RankingLifecycleState = "waiting" | "generating" | "ready" | "failed";

export interface RankingLifecycleResponse {
  state: RankingLifecycleState;
  generatedAt?: string;
  lastErrorCode?: string | null;
  generationRequestId?: string | null;
}

export interface SessionEventDiffResponse {
  status?: SessionSnapshotResponse["status"];
  inputsReady?: boolean;
  participantCount?: number;
  locationDraftUpdatedAt?: string;
  locationConfirmedAt?: string;
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

export type WillingnessSplit = "50_50" | "60_40" | "70_30";
export type PreferenceTag = "coffee" | "cocktails" | "vintage_shops" | "dessert" | "quiet";

export interface RankedVenue {
  venueId: string;
  name: string;
  lat: number;
  lng: number;
  etaParticipantA: number;
  etaParticipantB: number;
  category: string;
  openNow: boolean | null;
  fairnessScore: number;
  preferenceScore: number;
  totalScore: number;
  fairnessDeltaMinutes: number;
}

export async function upsertVenueReaction(input: {
  sessionId: string;
  venueId: string;
  participantId: string;
  reaction: VenueReactionType;
}): Promise<{ reaction: VenueReactionSummary }> {
  const response = await fetch(`${API_BASE_URL}/v1/decision/reaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(`upsertVenueReaction failed: ${response.status}`);
  }
  return (await response.json()) as { reaction: VenueReactionSummary };
}

export async function upsertShortlistVenue(input: {
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
}): Promise<{ shortlist: ShortlistVenue[] }> {
  const response = await fetch(`${API_BASE_URL}/v1/decision/shortlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(`upsertShortlistVenue failed: ${response.status}`);
  }
  return (await response.json()) as { shortlist: ShortlistVenue[] };
}

export async function confirmVenue(input: {
  sessionId: string;
  participantId: string;
  venueId: string;
}): Promise<{ confirmedPlace: ConfirmedPlace }> {
  const response = await fetch(`${API_BASE_URL}/v1/decision/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(`confirmVenue failed: ${response.status}`);
  }
  return (await response.json()) as { confirmedPlace: ConfirmedPlace };
}

export async function createSession(): Promise<CreateSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "host" })
  });

  if (!response.ok) {
    throw new Error(`createSession failed: ${response.status}`);
  }

  return (await response.json()) as CreateSessionResponse;
}

export async function joinSessionByToken(joinToken: string): Promise<JoinSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/sessions/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ joinToken, role: "invitee" })
  });

  if (!response.ok) {
    throw new Error(`joinSessionByToken failed: ${response.status}`);
  }

  return (await response.json()) as JoinSessionResponse;
}

export async function getSessionSnapshot(sessionId: string): Promise<SessionSnapshotResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error(`getSessionSnapshot failed: ${response.status}`);
  }
  return (await response.json()) as SessionSnapshotResponse;
}

export async function getSessionEvents(sessionId: string, since?: string): Promise<SessionEventResponse[]> {
  const suffix = since ? `?since=${encodeURIComponent(since)}` : "";
  const response = await fetch(`${API_BASE_URL}/v1/sessions/${sessionId}/events${suffix}`);
  if (!response.ok) {
    throw new Error(`getSessionEvents failed: ${response.status}`);
  }
  const payload = (await response.json()) as { events: SessionEventResponse[] };
  return payload.events;
}

export async function upsertLocationDraft(input: {
  mode: "geolocation" | "manual";
  sessionId: string;
  participantId: string;
  lat: number;
  lng: number;
  addressLabel: string;
}): Promise<{ expireAt: string }> {
  const response = await fetch(`${API_BASE_URL}/v1/location/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(`upsertLocationDraft failed: ${response.status}`);
  }
  return (await response.json()) as { expireAt: string };
}

export async function confirmLocation(input: {
  sessionId: string;
  participantId: string;
}): Promise<{ confirmedAt: string; inputsReady: boolean }> {
  const response = await fetch(`${API_BASE_URL}/v1/location/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(`confirmLocation failed: ${response.status}`);
  }
  return (await response.json()) as { confirmedAt: string; inputsReady: boolean };
}

export async function upsertRankingInputs(input: {
  sessionId: string;
  participantId: string;
  split: WillingnessSplit;
  tags: PreferenceTag[];
}): Promise<{
  split: WillingnessSplit;
  tags: PreferenceTag[];
  updatedAt: string;
  rankingInputsReady: boolean;
  rankingLifecycle: RankingLifecycleResponse;
  autoGenerationError?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/v1/ranking/inputs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(`upsertRankingInputs failed: ${response.status}`);
  }
  return (await response.json()) as {
    split: WillingnessSplit;
    tags: PreferenceTag[];
    updatedAt: string;
    rankingInputsReady: boolean;
    rankingLifecycle: RankingLifecycleResponse;
    autoGenerationError?: string;
  };
}

export async function getRankedResults(sessionId: string): Promise<{
  sessionId: string;
  generatedAt: string;
  results: RankedVenue[];
  mode: "auto" | "refresh";
}> {
  const response = await fetch(`${API_BASE_URL}/v1/ranking/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId })
  });
  if (!response.ok) {
    throw new Error(`getRankedResults failed: ${response.status}`);
  }
  return (await response.json()) as {
    sessionId: string;
    generatedAt: string;
    results: RankedVenue[];
    mode: "auto" | "refresh";
  };
}
