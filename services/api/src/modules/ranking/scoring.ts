import type { PreferenceTag, ScoredCandidate, WillingnessSplit } from "./contracts";

export const SCORE_WEIGHTS: Record<WillingnessSplit, { fairnessWeight: number; preferenceWeight: number }> = {
  "50_50": { fairnessWeight: 0.7, preferenceWeight: 0.3 },
  "60_40": { fairnessWeight: 0.8, preferenceWeight: 0.2 },
  "70_30": { fairnessWeight: 0.8, preferenceWeight: 0.2 }
};

const TARGET_RATIO_BY_SPLIT: Record<WillingnessSplit, number> = {
  "50_50": 0.5,
  "60_40": 0.6,
  "70_30": 0.7
};

function computeFairness(etaParticipantA: number, etaParticipantB: number, split: WillingnessSplit): number {
  const total = etaParticipantA + etaParticipantB;
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  const targetRatio = TARGET_RATIO_BY_SPLIT[split];
  const actualRatio = etaParticipantA / total;
  const maxDistance = Math.max(targetRatio, 1 - targetRatio);
  const normalizedDistance = Math.abs(actualRatio - targetRatio) / maxDistance;
  return Math.max(0, 1 - normalizedDistance);
}

function computePreference(candidateTags: PreferenceTag[], selectedTags: PreferenceTag[]): number {
  if (selectedTags.length === 0) {
    return 0;
  }

  const selected = new Set(selectedTags);
  const matches = candidateTags.filter((tag) => selected.has(tag));
  return matches.length / selected.size;
}

export function scoreCandidates(
  candidates: Array<{
    venueId: string;
    name: string;
    lat: number;
    lng: number;
    category: string;
    openNow: boolean | null;
    tags: PreferenceTag[];
    etaParticipantA: number;
    etaParticipantB: number;
  }>,
  split: WillingnessSplit,
  selectedTags: PreferenceTag[]
): ScoredCandidate[] {
  const { fairnessWeight, preferenceWeight } = SCORE_WEIGHTS[split];

  return candidates
    .map((candidate) => {
      const fairnessScore = computeFairness(candidate.etaParticipantA, candidate.etaParticipantB, split);
      const preferenceScore = computePreference(candidate.tags, selectedTags);
      const totalScore = fairnessWeight * fairnessScore + preferenceWeight * preferenceScore;

      return {
        ...candidate,
        fairnessScore,
        preferenceScore,
        totalScore
      } as ScoredCandidate;
    })
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return a.venueId.localeCompare(b.venueId);
    });
}
