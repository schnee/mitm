import { describe, expect, it } from "vitest";
import { RankingRepository } from "../src/modules/ranking/repository";
import { RankingService } from "../src/modules/ranking/service";
import { SessionRepository } from "../src/modules/session/repository";
import { upsertRankingInputsHandler } from "../src/routes/ranking/upsertRankingInputs";

describe("ranking inputs", () => {
  it("accepts only supported split values and curated tags", async () => {
    const sessions = new SessionRepository();
    const ranking = new RankingRepository(sessions);
    const created = sessions.createSession({ joinToken: "rankinput1234567890", role: "host" });

    const valid = await upsertRankingInputsHandler(
      {
        sessionId: created.sessionId,
        participantId: created.participantId,
        split: "50_50",
        tags: ["coffee", "dessert"]
      },
      { repository: ranking }
    );

    expect(valid.status).toBe(200);
    expect(valid.body).toMatchObject({
      split: "50_50",
      tags: ["coffee", "dessert"],
      rankingInputsReady: false,
      rankingLifecycle: { state: "waiting" }
    });
  });

  it("returns waiting for first save and generating when both participants saved", async () => {
    const sessions = new SessionRepository();
    const ranking = new RankingRepository(sessions);
    const created = sessions.createSession({ joinToken: "rankwait1234567890", role: "host" });
    const joined = sessions.joinSession({ joinToken: "rankwait1234567890", role: "invitee" });

    const first = await upsertRankingInputsHandler(
      {
        sessionId: created.sessionId,
        participantId: created.participantId,
        split: "60_40",
        tags: ["coffee"]
      },
      { repository: ranking }
    );

    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({
      rankingInputsReady: false,
      rankingLifecycle: { state: "waiting", lastErrorCode: null }
    });

    const second = await upsertRankingInputsHandler(
      {
        sessionId: created.sessionId,
        participantId: joined.participantId,
        split: "60_40",
        tags: ["quiet"]
      },
      { repository: ranking }
    );

    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({
      rankingInputsReady: true,
      rankingLifecycle: { state: "generating", lastErrorCode: null }
    });

    const snapshot = sessions.getSessionSnapshot(created.sessionId);
    expect(snapshot?.rankingInputsReady).toBe(true);
    expect(snapshot?.rankingLifecycle).toMatchObject({ state: "generating" });
    expect(snapshot?.rankedResults).toEqual([]);

    const events = sessions.listSessionEvents(created.sessionId);
    const orchestrationEvents = events.filter(
      (event) => event.eventType === "session_updated" && typeof event.diff?.rankingInputsReady === "boolean"
    );
    expect(orchestrationEvents.length).toBeGreaterThanOrEqual(2);
    expect(orchestrationEvents.at(-1)?.diff).toMatchObject({
      rankingInputsReady: true,
      rankingLifecycle: { state: expect.stringMatching(/generating|ready/) }
    });
  });

  it("triggers one idempotent auto-generation under near-simultaneous second-save requests", async () => {
    const sessions = new SessionRepository();
    const ranking = new RankingRepository(sessions);
    const created = sessions.createSession({ joinToken: "ranksimul12345678", role: "host" });
    const joined = sessions.joinSession({ joinToken: "ranksimul12345678", role: "invitee" });

    sessions.upsertParticipantLocationDraft({
      sessionId: created.sessionId,
      participantId: created.participantId,
      mode: "manual",
      lat: 40.71,
      lng: -74.0,
      addressLabel: "Host"
    });
    sessions.confirmParticipantLocation({ sessionId: created.sessionId, participantId: created.participantId });
    sessions.upsertParticipantLocationDraft({
      sessionId: created.sessionId,
      participantId: joined.participantId,
      mode: "manual",
      lat: 40.74,
      lng: -73.98,
      addressLabel: "Invitee"
    });
    sessions.confirmParticipantLocation({ sessionId: created.sessionId, participantId: joined.participantId });

    await upsertRankingInputsHandler(
      {
        sessionId: created.sessionId,
        participantId: created.participantId,
        split: "50_50",
        tags: ["coffee"]
      },
      { repository: ranking }
    );

    let generationCalls = 0;
    const service = new RankingService(sessions, ranking, {
      searchCandidates: async () => {
        generationCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return [
          {
            venueId: "venue-1",
            name: "Coffee Spot",
            lat: 40.72,
            lng: -73.99,
            category: "cafe",
            openNow: true,
            tags: ["coffee"]
          }
        ];
      },
      getTravelDurations: async () => [[12], [14]]
    });

    const secondPayload = {
      sessionId: created.sessionId,
      participantId: joined.participantId,
      split: "50_50" as const,
      tags: ["coffee"]
    };

    const [first, second] = await Promise.all([
      upsertRankingInputsHandler(secondPayload, { repository: ranking, service }),
      upsertRankingInputsHandler(secondPayload, { repository: ranking, service })
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(generationCalls).toBe(1);

    const snapshot = sessions.getSessionSnapshot(created.sessionId);
    expect(snapshot?.rankingLifecycle).toMatchObject({ state: "ready" });
    expect(snapshot?.rankedResults).toHaveLength(1);
  });

  it("returns INVALID_RANKING_INPUTS when split or tags are invalid", async () => {
    const sessions = new SessionRepository();
    const ranking = new RankingRepository(sessions);
    const created = sessions.createSession({ joinToken: "rankinvalid123456", role: "host" });

    const invalidSplit = await upsertRankingInputsHandler(
      {
        sessionId: created.sessionId,
        participantId: created.participantId,
        split: "80_20",
        tags: ["coffee"]
      },
      { repository: ranking }
    );
    expect(invalidSplit.status).toBe(400);
    expect(invalidSplit.body).toEqual({ error: "INVALID_RANKING_INPUTS" });

    const invalidTag = await upsertRankingInputsHandler(
      {
        sessionId: created.sessionId,
        participantId: created.participantId,
        split: "60_40",
        tags: ["coffee", "unknown_tag"]
      },
      { repository: ranking }
    );
    expect(invalidTag.status).toBe(400);
    expect(invalidTag.body).toEqual({ error: "INVALID_RANKING_INPUTS" });
  });

  it("returns participant not found for unknown session participant", async () => {
    const sessions = new SessionRepository();
    const ranking = new RankingRepository(sessions);

    const missing = await upsertRankingInputsHandler(
      {
        sessionId: "missing-session",
        participantId: "missing-participant",
        split: "70_30",
        tags: ["quiet"]
      },
      { repository: ranking }
    );

    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: "PARTICIPANT_NOT_FOUND" });
  });
});
