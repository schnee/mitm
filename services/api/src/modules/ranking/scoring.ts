import type { PreferenceTag, ScoredCandidate, WillingnessSplit } from "./contracts";

function parseSplit(split: WillingnessSplit): { first: number; second: number } {
  const [first, second] = split.split("_").map(Number);
  return { first, second };
}

function computeTargetRatio(split: WillingnessSplit): number {
  const { first } = parseSplit(split);
  return first / 100;
}

function computeFairness(etaParticipantA: number, etaParticipantB: number, split: WillingnessSplit): number {
  const total = etaParticipantA + etaParticipantB;
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  const targetRatio = computeTargetRatio(split);
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
  const { first } = parseSplit(split);
  const fairnessWeight = 0.7 + (first - 50) * 0.01;
  const preferenceWeight = 1 - fairnessWeight;

  return candidates
    .map((candidate) => {
      const fairnessScore = computeFairness(candidate.etaParticipantA, candidate.etaParticipantB, split);
      const preferenceScore = computePreference(candidate.tags, selectedTags);
      const totalScore = fairnessScore * fairnessWeight + preferenceScore * preferenceWeight;
      return {
        ...candidate,
        fairnessScore,
        preferenceScore,
        totalScore
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}