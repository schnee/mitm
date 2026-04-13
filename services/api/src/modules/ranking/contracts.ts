export type WillingnessSplit = string; // validated separately via validation.ts

export type PreferenceTag = "coffee" | "lunch" | "dinner" | "cocktails" | "dessert" | "museum" | "walk_and_talk" | "vintage_shops" | "quiet";

export interface RankingInputState {
  split: WillingnessSplit;
  tags: PreferenceTag[];
  updatedAt: string;
}

export interface RankingCandidate {
  venueId: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  openNow: boolean | null;
  tags: PreferenceTag[];
}

export interface ScoredCandidate extends RankingCandidate {
  etaParticipantA: number;
  etaParticipantB: number;
  fairnessScore: number;
  preferenceScore: number;
  totalScore: number;
}

export interface RankedVenue {
  venueId: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  openNow: boolean | null;
  etaParticipantA: number;
  etaParticipantB: number;
  fairnessScore: number;
  preferenceScore: number;
  totalScore: number;
  fairnessDeltaMinutes: number;
}
