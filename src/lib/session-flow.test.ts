import { describe, expect, it } from "vitest";
import { deriveSessionFlow } from "./session-flow";

describe("deriveSessionFlow", () => {
  it("keeps fixed step order and single active location step initially", () => {
    const flow = deriveSessionFlow({
      myLocationConfirmed: false,
      partnerLocationConfirmed: false,
      myPreferencesSaved: false,
      partnerPreferencesSaved: false,
      rankedResultsCount: 0,
      shortlistCount: 0,
      confirmedVenueId: null
    });

    expect(flow.activeStepId).toBe("location");
    expect(flow.steps.map((step) => step.id)).toEqual(["location", "preferences", "spots", "shortlist", "confirm"]);
  });

  it("collapses completed location with summary and advances to preferences", () => {
    const flow = deriveSessionFlow({
      myLocationConfirmed: true,
      partnerLocationConfirmed: true,
      myPreferencesSaved: false,
      partnerPreferencesSaved: false,
      rankedResultsCount: 0,
      shortlistCount: 0,
      confirmedVenueId: null
    });

    expect(flow.activeStepId).toBe("preferences");
    expect(flow.steps.find((step) => step.id === "location")?.summary).toBe("Location: Confirmed");
  });

  it("keeps partner blocker ownership when only my preferences are saved", () => {
    const flow = deriveSessionFlow({
      myLocationConfirmed: true,
      partnerLocationConfirmed: true,
      myPreferencesSaved: true,
      partnerPreferencesSaved: false,
      rankedResultsCount: 0,
      shortlistCount: 0,
      confirmedVenueId: null
    });

    expect(flow.activeStepId).toBe("spots");
    expect(flow.steps.find((step) => step.id === "spots")?.blockedBy).toBe("partner");
    expect(flow.steps.find((step) => step.id === "spots")?.summary).toBe("Spots: Waiting for partner preferences");
  });

  it("keeps confirm as active after shortlist when waiting on self", () => {
    const flow = deriveSessionFlow({
      myLocationConfirmed: true,
      partnerLocationConfirmed: true,
      myPreferencesSaved: true,
      partnerPreferencesSaved: true,
      rankedResultsCount: 3,
      shortlistCount: 1,
      confirmedVenueId: null
    });

    expect(flow.activeStepId).toBe("confirm");
    expect(flow.steps.find((step) => step.id === "shortlist")?.summary).toBe("Shortlist: 1 spot");
    expect(flow.steps.find((step) => step.id === "confirm")?.blockedBy).toBe("self");
  });
});
