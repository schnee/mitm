import { describe, expect, it } from "vitest";
import { deriveSessionFlow } from "./session-flow";

describe("deriveSessionFlow", () => {
  it("keeps fixed step order with unified setup initially", () => {
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
    expect(flow.steps.map((step) => step.id)).toEqual(["location", "spots", "shortlist", "confirm"]);
  });

  it("advances to spots after location setup is complete", () => {
    const flow = deriveSessionFlow({
      myLocationConfirmed: true,
      partnerLocationConfirmed: false,
      myPreferencesSaved: false,
      partnerPreferencesSaved: false,
      rankedResultsCount: 0,
      shortlistCount: 0,
      confirmedVenueId: null
    });

    expect(flow.activeStepId).toBe("spots");
    expect(flow.steps.find((step) => step.id === "location")?.completed).toBe(true);
    expect(flow.steps.find((step) => step.id === "location")?.summary).toBe("Setup: Complete");
  });

  it("blocks spots when partner has not completed setup", () => {
    const flow = deriveSessionFlow({
      myLocationConfirmed: true,
      partnerLocationConfirmed: false,
      myPreferencesSaved: true,
      partnerPreferencesSaved: false,
      rankedResultsCount: 0,
      shortlistCount: 0,
      confirmedVenueId: null
    });

    expect(flow.activeStepId).toBe("spots");
    expect(flow.steps.find((step) => step.id === "spots")?.blockedBy).toBe("partner");
    expect(flow.steps.find((step) => step.id === "spots")?.summary).toBe("Spots: Waiting for partner setup");
  });

  it("allows spots progression when both have completed setup", () => {
    const flow = deriveSessionFlow({
      myLocationConfirmed: true,
      partnerLocationConfirmed: true,
      myPreferencesSaved: true,
      partnerPreferencesSaved: true,
      rankedResultsCount: 0,
      shortlistCount: 0,
      confirmedVenueId: null
    });

    expect(flow.activeStepId).toBe("spots");
    expect(flow.steps.find((step) => step.id === "spots")?.blockedBy).toBe(null);
  });

  it("keeps confirm as active after shortlist", () => {
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