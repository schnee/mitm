export type WillingnessSplit = "50_50" | "60_40" | "70_30" | "80_20" | "90_10" | string;

export type PreferenceTag =
  | "coffee"
  | "lunch"
  | "dinner"
  | "cocktails"
  | "dessert"
  | "museum"
  | "walk_and_talk"
  | "vintage_shops"
  | "quiet";

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