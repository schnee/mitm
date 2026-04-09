import { describe, expect, it } from "vitest";
import { RankingRepository } from "../src/modules/ranking/repository";
import { scoreCandidates } from "../src/modules/ranking/scoring";
import { RankingService } from "../src/modules/ranking/service";
import { SessionRepository } from "../src/modules/session/repository";
import { getRankedResultsHandler } from "../src/routes/ranking/getRankedResults";

describe("ranking results", () => {
  it("prefers ETA burden aligned with selected split", () => {
    const rankedForBalanced = scoreCandidates(
      [
        {
          venueId: "balanced",
          name: "Balanced Place",
          lat: 0,
          lng: 0,
          category: "cafe",
          openNow: true,
          tags: ["coffee"],
          etaParticipantA: 20,
          etaParticipantB: 20
        },
        {
          venueId: "host-heavy",
          name: "Host Heavy",
          lat: 0,
          lng: 0,
          category: "bar",
          openNow: true,
          tags: ["cocktails"],
          etaParticipantA: 35,
          etaParticipantB: 15
        }
      ],
      "50_50",
      ["coffee"]
    );

    const rankedForSkewed = scoreCandidates(
      [
        {
          venueId: "balanced",
          name: "Balanced Place",
          lat: 0,
          lng: 0,
          category: "cafe",
          openNow: true,
          tags: ["coffee"],
          etaParticipantA: 20,
          etaParticipantB: 20
        },
        {
          venueId: "host-heavy",
          name: "Host Heavy",
          lat: 0,
          lng: 0,
          category: "bar",
          openNow: true,
          tags: ["cocktails"],
          etaParticipantA: 35,
          etaParticipantB: 15
        }
      ],
      "70_30",
      ["coffee"]
    );

    expect(rankedForBalanced[0]?.venueId).toBe("balanced");
    expect(rankedForSkewed[0]?.venueId).toBe("host-heavy");
  });

  it("reorder when tags change", () => {
    const candidates = [
      {
        venueId: "a",
        name: "Alpha Cafe",
        lat: 0,
        lng: 0,
        category: "cafe",
        openNow: true,
        tags: ["coffee" as const],
        etaParticipantA: 20,
        etaParticipantB: 20
      },
      {
        venueId: "b",
        name: "Beta Bar",
        lat: 0,
        lng: 0,
        category: "bar",
        openNow: true,
        tags: ["cocktails" as const],
        etaParticipantA: 20,
        etaParticipantB: 20
      }
    ];

    expect(scoreCandidates(candidates, "50_50", ["coffee"])[0]?.venueId).toBe("a");
    expect(scoreCandidates(candidates, "50_50", ["cocktails"])[0]?.venueId).toBe("b");
  });

  it("keeps tie-break deterministic by venueId", () => {
    const ranked = scoreCandidates(
      [
        {
          venueId: "venue-b",
          name: "B",
          lat: 0,
          lng: 0,
          category: "cafe",
          openNow: true,
          tags: [],
          etaParticipantA: 20,
          etaParticipantB: 20
        },
        {
          venueId: "venue-a",
          name: "A",
          lat: 0,
          lng: 0,
          category: "cafe",
          openNow: true,
          tags: [],
          etaParticipantA: 20,
          etaParticipantB: 20
        }
      ],
      "50_50",
      []
    );

    expect(ranked[0]?.venueId).toBe("venue-a");
    expect(ranked[1]?.venueId).toBe("venue-b");
  });

  it("blocks endpoint when inputs are not ready", async () => {
    const sessions = new SessionRepository();
    const ranking = new RankingRepository(sessions);
    const service = new RankingService(sessions, ranking, {
      searchCandidates: async () => [],
      getTravelDurations: async () => []
    });
    const created = sessions.createSession({ joinToken: "rankready1234567890", role: "host" });

    const response = await getRankedResultsHandler({ sessionId: created.sessionId }, { service });
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "INPUTS_NOT_READY" });
  });

  it("returns ranked candidates and changes ordering when inputs change", async () => {
    const sessions = new SessionRepository();
    const ranking = new RankingRepository(sessions);
    const created = sessions.createSession({ joinToken: "rankresults1234567", role: "host" });
    const joined = sessions.joinSession({ joinToken: "rankresults1234567", role: "invitee" });

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

    ranking.upsertRankingInputs({
      sessionId: created.sessionId,
      participantId: created.participantId,
      split: "50_50",
      tags: ["coffee"]
    });
    ranking.upsertRankingInputs({
      sessionId: created.sessionId,
      participantId: joined.participantId,
      split: "50_50",
      tags: ["coffee"]
    });

    const service = new RankingService(sessions, ranking, {
      searchCandidates: async () => [
        {
          venueId: "coffee-spot",
          name: "Coffee Spot",
          lat: 40.72,
          lng: -73.99,
          category: "cafe",
          openNow: true,
          tags: ["coffee"]
        },
        {
          venueId: "cocktail-room",
          name: "Cocktail Room",
          lat: 40.73,
          lng: -73.97,
          category: "bar",
          openNow: true,
          tags: ["cocktails"]
        }
      ],
      getTravelDurations: async () => [
        [15, 15],
        [15, 15]
      ]
    });

    const first = await getRankedResultsHandler({ sessionId: created.sessionId }, { service });
    expect(first.status).toBe(200);
    const firstBody = first.body as {
      results: Array<{
        venueId: string;
        etaParticipantA: number;
        etaParticipantB: number;
        fairnessScore: number;
        preferenceScore: number;
        totalScore: number;
        fairnessDeltaMinutes: number;
      }>;
    };
    expect(firstBody.results[0]?.venueId).toBe("coffee-spot");
    expect(firstBody.results[0]).toMatchObject({
      fairnessScore: expect.any(Number),
      preferenceScore: expect.any(Number),
      totalScore: expect.any(Number),
      fairnessDeltaMinutes: expect.any(Number)
    });
    expect(firstBody.results[0]?.fairnessDeltaMinutes).toBe(
      Math.abs((firstBody.results[0]?.etaParticipantA ?? 0) - (firstBody.results[0]?.etaParticipantB ?? 0))
    );

    ranking.upsertRankingInputs({
      sessionId: created.sessionId,
      participantId: created.participantId,
      split: "50_50",
      tags: ["cocktails"]
    });
    ranking.upsertRankingInputs({
      sessionId: created.sessionId,
      participantId: joined.participantId,
      split: "50_50",
      tags: ["cocktails"]
    });

    const second = await getRankedResultsHandler({ sessionId: created.sessionId }, { service });
    expect(second.status).toBe(200);
    const secondBody = second.body as {
      results: Array<{
        venueId: string;
        fairnessScore: number;
        preferenceScore: number;
        totalScore: number;
        fairnessDeltaMinutes: number;
      }>;
    };
    expect(secondBody.results[0]?.venueId).toBe("cocktail-room");
    expect(secondBody.results[0]).toMatchObject({
      fairnessScore: expect.any(Number),
      preferenceScore: expect.any(Number),
      totalScore: expect.any(Number),
      fairnessDeltaMinutes: expect.any(Number)
    });
  });
});
