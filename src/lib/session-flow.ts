export type SessionStepId = "location" | "preferences" | "spots" | "shortlist" | "confirm";

export interface SessionFlowStep {
  id: SessionStepId;
  title: string;
  completed: boolean;
  blockedBy: "self" | "partner" | null;
  summary: string;
}

export interface DeriveSessionFlowInput {
  myLocationConfirmed: boolean;
  partnerLocationConfirmed: boolean;
  myPreferencesSaved: boolean;
  partnerPreferencesSaved: boolean;
  rankedResultsCount: number;
  shortlistCount: number;
  confirmedVenueId: string | null;
}

const STEP_ORDER: SessionStepId[] = ["location", "preferences", "spots", "shortlist", "confirm"];

export function deriveSessionFlow(input: DeriveSessionFlowInput): { activeStepId: SessionStepId; steps: SessionFlowStep[] } {
  const locationCompleted = input.myLocationConfirmed;
  const preferencesCompleted = input.myPreferencesSaved;
  const spotsCompleted = input.shortlistCount > 0 || Boolean(input.confirmedVenueId);
  const shortlistCompleted = input.shortlistCount > 0 || Boolean(input.confirmedVenueId);
  const confirmCompleted = Boolean(input.confirmedVenueId);
  const spotsBlockedBy: "self" | "partner" | null = !preferencesCompleted
    ? input.partnerPreferencesSaved
      ? "self"
      : "partner"
    : spotsCompleted
      ? null
      : input.partnerPreferencesSaved
        ? "self"
        : "partner";

  const steps: SessionFlowStep[] = [
    {
      id: "location",
      title: "Location",
      completed: locationCompleted,
      blockedBy: locationCompleted ? null : "self",
      summary: locationCompleted ? "Location: Confirmed" : "Location: Waiting"
    },
    {
      id: "preferences",
      title: "Preferences",
      completed: preferencesCompleted,
      blockedBy: preferencesCompleted ? null : "self",
      summary: preferencesCompleted ? "Preferences: Saved" : "Preferences: Waiting"
    },
    {
      id: "spots",
      title: "Spots",
      completed: spotsCompleted,
      blockedBy: spotsBlockedBy,
      summary: spotsCompleted
        ? "Spots: map + list synced"
        : spotsBlockedBy === "partner"
          ? "Spots: Waiting for partner preferences"
          : "Spots: Waiting"
    },
    {
      id: "shortlist",
      title: "Shortlist",
      completed: shortlistCompleted,
      blockedBy: shortlistCompleted ? null : spotsCompleted ? "self" : "partner",
      summary: input.shortlistCount > 0 ? `Shortlist: ${input.shortlistCount} spot${input.shortlistCount === 1 ? "" : "s"}` : "Shortlist: None"
    },
    {
      id: "confirm",
      title: "Confirm",
      completed: confirmCompleted,
      blockedBy: confirmCompleted ? null : "self",
      summary: confirmCompleted ? "Confirm: Final place selected" : "Confirm: Pending"
    }
  ];

  const activeStep = STEP_ORDER.find((stepId) => {
    const step = steps.find((item) => item.id === stepId);
    return step ? !step.completed : false;
  });

  return {
    activeStepId: activeStep ?? "confirm",
    steps
  };
}
