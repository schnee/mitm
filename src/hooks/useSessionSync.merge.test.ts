import { describe, expect, it } from "vitest";
import type { SessionSnapshotResponse } from "../lib/api/session-client";
import { mergeSessionEvent } from "./useSessionSync";

const baseSnapshot: SessionSnapshotResponse = {
  sessionId: "session-1",
  status: "locating",
  updatedAt: "2026-04-10T12:00:00.000Z",
  inputsReady: false,
  rankingInputsReady: false,
  rankingLifecycle: { state: "waiting" },
  rankedResults: [],
  shortlist: [],
  reactions: [],
  confirmedPlace: null,
  participants: [
    {
      participantId: "p-host",
      role: "host",
      joinedAt: "2026-04-10T11:00:00.000Z",
      locationDraftUpdatedAt: null,
      locationConfirmedAt: null,
      rankingInputsUpdatedAt: null
    },
    {
      participantId: "p-invitee",
      role: "invitee",
      joinedAt: "2026-04-10T11:01:00.000Z",
      locationDraftUpdatedAt: null,
      locationConfirmedAt: null,
      rankingInputsUpdatedAt: null
    }
  ]
};

describe("mergeSessionEvent", () => {
  it("preserves participant continuity timestamps from session_updated diffs", () => {
    const merged = mergeSessionEvent(baseSnapshot, {
      eventType: "session_updated",
      sessionId: "session-1",
      participantId: "p-host",
      updatedAt: "2026-04-10T12:02:00.000Z",
      diff: {
        locationDraftUpdatedAt: "2026-04-10T12:01:00.000Z",
        rankingInputsUpdatedAt: "2026-04-10T12:02:00.000Z"
      }
    });

    const host = merged.participants.find((item) => item.participantId === "p-host");
    expect(host?.locationDraftUpdatedAt).toBe("2026-04-10T12:01:00.000Z");
    expect(host?.rankingInputsUpdatedAt).toBe("2026-04-10T12:02:00.000Z");
  });
});
