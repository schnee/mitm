import { describe, expect, it } from "vitest";
import { RankingRepository } from "../src/modules/ranking/repository";
import { SessionRepository } from "../src/modules/session/repository";
import { SessionTransitionError, canTransition } from "../src/modules/session/state-machine";
import { getSessionSnapshotHandler } from "../src/routes/sessions/getSessionSnapshot";
import { sessionEventsHandler } from "../src/routes/sessions/sessionEvents";

describe("session sync", () => {
  it("returns canonical snapshot with deterministic participant order", async () => {
    const repository = new SessionRepository();
    const created = repository.createSession({ joinToken: "sync1234567890", role: "host" });
    repository.joinSession({ joinToken: "sync1234567890", role: "invitee" });

    const response = await getSessionSnapshotHandler(created.sessionId, { repository });
    expect(response.status).toBe(200);
    const body = response.body as {
      participants: Array<{
        role: string;
        locationConfirmedAt: string | null;
        locationDraftUpdatedAt: string | null;
        rankingInputsUpdatedAt: string | null;
      }>;
    };
    expect(body.participants[0]?.role).toBe("host");
    expect(body.participants[1]?.role).toBe("invitee");
    expect(body.participants[0]?.locationConfirmedAt).toBeNull();
    expect(body.participants[0]?.locationDraftUpdatedAt).toBeNull();
    expect(body.participants[0]?.rankingInputsUpdatedAt).toBeNull();
  });

  it("includes continuity timestamps after draft and ranking saves", async () => {
    const repository = new SessionRepository();
    const rankingRepository = new RankingRepository(repository);
    const created = repository.createSession({ joinToken: "continuity123456", role: "host" });
    repository.joinSession({ joinToken: "continuity123456", role: "invitee" });

    repository.upsertParticipantLocationDraft({
      sessionId: created.sessionId,
      participantId: created.participantId,
      mode: "manual",
      lat: 47.61,
      lng: -122.33,
      addressLabel: "Downtown"
    });
    rankingRepository.upsertRankingInputs({
      sessionId: created.sessionId,
      participantId: created.participantId,
      split: "60_40",
      tags: ["coffee"]
    });

    const response = await getSessionSnapshotHandler(created.sessionId, { repository });
    expect(response.status).toBe(200);
    const body = response.body as {
      participants: Array<{
        role: string;
        locationDraftUpdatedAt: string | null;
        rankingInputsUpdatedAt: string | null;
      }>;
    };

    const host = body.participants.find((participant) => participant.role === "host");
    expect(host?.locationDraftUpdatedAt).toEqual(expect.any(String));
    expect(host?.rankingInputsUpdatedAt).toEqual(expect.any(String));
  });

  it("emits participant_joined and session_updated events", async () => {
    const repository = new SessionRepository();
    const created = repository.createSession({ joinToken: "events1234567890", role: "host" });
    repository.joinSession({ joinToken: "events1234567890", role: "invitee" });

    const response = await sessionEventsHandler(created.sessionId, { repository });
    expect(response.status).toBe(200);
    const body = response.body as { events: Array<{ eventType: string }> };
    const eventTypes = body.events.map((item) => item.eventType);

    expect(eventTypes).toContain("participant_joined");
    expect(eventTypes).toContain("session_updated");
  });

  it("rejects illegal lifecycle transitions", () => {
    expect(canTransition("expired", "joined")).toBe(false);

    const repository = new SessionRepository();
    const created = repository.createSession({ joinToken: "transition1234567890", role: "host" });
    repository.updateSessionStatus(created.sessionId, "joined");
    repository.updateSessionStatus(created.sessionId, "locating");
    repository.updateSessionStatus(created.sessionId, "ranked");
    repository.updateSessionStatus(created.sessionId, "confirmed");

    expect(() => repository.updateSessionStatus(created.sessionId, "joined")).toThrowError(SessionTransitionError);
  });
});
