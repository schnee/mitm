import { describe, expect, it } from "vitest";
import { deriveDraftReady, derivePreferencesSaved } from "./session-continuity";

describe("session continuity helpers", () => {
  it("treats canonical draft timestamp as confirm-ready", () => {
    expect(deriveDraftReady("2026-04-10T12:00:00Z", false)).toBe(true);
    expect(deriveDraftReady(null, true)).toBe(true);
    expect(deriveDraftReady(null, false)).toBe(false);
  });

  it("prefers canonical ranking input timestamp over local lifecycle proxy", () => {
    expect(derivePreferencesSaved("2026-04-10T12:00:00Z", false)).toBe(true);
    expect(derivePreferencesSaved(null, true)).toBe(true);
    expect(derivePreferencesSaved(null, false)).toBe(false);
  });
});
