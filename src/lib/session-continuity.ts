export function deriveDraftReady(locationDraftUpdatedAt: string | null | undefined, optimisticDraftSaved: boolean): boolean {
  return Boolean(locationDraftUpdatedAt) || optimisticDraftSaved;
}

export function derivePreferencesSaved(
  rankingInputsUpdatedAt: string | null | undefined,
  optimisticPreferencesSaved: boolean
): boolean {
  return Boolean(rankingInputsUpdatedAt) || optimisticPreferencesSaved;
}
