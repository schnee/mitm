export type SessionStepId = "location" | "spots" | "shortlist" | "confirm";
export type MapStage = "setup" | "spots" | "shortlist" | "confirm";

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

const STEP_ORDER: SessionStepId[] = ["location", "spots", "shortlist", "confirm"];

export function deriveSessionFlow(input: DeriveSessionFlowInput): { activeStepId: SessionStepId; steps: SessionFlowStep[] } {
  const locationCompleted = input.myLocationConfirmed;
  // Unified setup: preferences are saved with location in single step
  const preferencesCompleted = input.myPreferencesSaved || input.myLocationConfirmed;
  const partnerSetupComplete = input.partnerPreferencesSaved || input.partnerLocationConfirmed;
  const spotsCompleted = false; // Never auto-complete - user must explicitly select
  const shortlistCompleted = input.shortlistCount > 0 || Boolean(input.confirmedVenueId);
  const confirmCompleted = Boolean(input.confirmedVenueId);
  const spotsBlockedBy: "self" | "partner" | null = !locationCompleted
    ? partnerSetupComplete
      ? "self"
      : "partner"
    : spotsCompleted
      ? null
      : locationCompleted && partnerSetupComplete
        ? null
        : partnerSetupComplete
          ? "self"
          : "partner";

  const steps: SessionFlowStep[] = [
    {
      id: "location",
      title: "Setup",
      completed: locationCompleted,
      blockedBy: locationCompleted ? null : "self",
      summary: locationCompleted ? "Setup: Complete" : "Setup: Waiting"
    },
    {
      id: "spots",
      title: "Spots",
      completed: spotsCompleted,
      blockedBy: spotsBlockedBy,
      summary: spotsCompleted
        ? "Spots: map + list synced"
        : spotsBlockedBy === "partner"
          ? "Spots: Waiting for partner setup"
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

export function deriveMapStage(step: SessionStepId): MapStage {
  if (step === "location") return "setup";
  if (step === "spots") return "spots";
  if (step === "shortlist") return "shortlist";
  return "confirm";
}
