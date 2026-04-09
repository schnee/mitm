import { describe, expect, it } from "vitest";
import { LocationRepository } from "../src/modules/location/repository";
import { RankingRepository } from "../src/modules/ranking/repository";
import { RankingService } from "../src/modules/ranking/service";
import { SessionDomainError, SessionRepository } from "../src/modules/session/repository";
import { getSessionFunnelHandler } from "../src/routes/analytics/getSessionFunnel";

describe("repository funnel contracts", () => {
  it("stores session_start and returns events in chronological order", () => {
    const repository = new SessionRepository();
    const created = repository.createSession({ joinToken: "funnel1234567890", role: "host" });

    repository.recordFunnelEvent(created.sessionId, "results_returned", { resultCount: 2 });
    const events = repository.listFunnelEvents(created.sessionId);

    expect(events.map((item) => item.event)).toEqual(["session_start", "results_returned"]);
    expect(events[0]?.metadata).toEqual({ role: "host" });
    expect(events[1]?.metadata).toEqual({ resultCount: 2 });
  });

  it("dedupes milestone events for inputs_set and decision_confirmed", () => {
    const repository = new SessionRepository();
    const created = repository.createSession({ joinToken: "funneldedupe1234", role: "host" });

    repository.recordFunnelEvent(created.sessionId, "inputs_set");
    repository.recordFunnelEvent(created.sessionId, "inputs_set");
    repository.recordFunnelEvent(created.sessionId, "decision_confirmed", { venueId: "venue-1" });
    repository.recordFunnelEvent(created.sessionId, "decision_confirmed", { venueId: "venue-1" });

    const events = repository.listFunnelEvents(created.sessionId);
    expect(events.filter((item) => item.event === "inputs_set")).toHaveLength(1);
    expect(events.filter((item) => item.event === "decision_confirmed")).toHaveLength(1);
  });

  it("throws SESSION_NOT_FOUND for missing session", () => {
    const repository = new SessionRepository();

    expect(() => repository.recordFunnelEvent("missing", "inputs_set")).toThrowError(SessionDomainError);
    expect(() => repository.listFunnelEvents("missing")).toThrowError(SessionDomainError);
  });
});

describe("funnel lifecycle emission", () => {
  it("records all required lifecycle events and dedupes decision confirmation retries", async () => {
    const sessions = new SessionRepository();
    const locations = new LocationRepository(sessions);
    const ranking = new RankingRepository(sessions);
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
        }
      ],
      getTravelDurations: async () => [[12], [14]]
    });

    const created = sessions.createSession({ joinToken: "lifecycle12345678", role: "host" });
    const joined = sessions.joinSession({ joinToken: "lifecycle12345678", role: "invitee" });

    locations.upsertLocationDraft({
      mode: "manual",
      sessionId: created.sessionId,
      participantId: created.participantId,
      lat: 40.71,
      lng: -74.0,
      addressLabel: "Host"
    });
    locations.confirmLocation({ sessionId: created.sessionId, participantId: created.participantId });

    locations.upsertLocationDraft({
      mode: "manual",
      sessionId: created.sessionId,
      participantId: joined.participantId,
      lat: 40.74,
      lng: -73.98,
      addressLabel: "Invitee"
    });
    locations.confirmLocation({ sessionId: created.sessionId, participantId: joined.participantId });

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

    const ranked = await service.generateRankedResults(created.sessionId);
    sessions.upsertShortlistVenue({
      sessionId: created.sessionId,
      participantId: created.participantId,
      venueId: ranked.results[0]!.venueId,
      name: ranked.results[0]!.name,
      category: ranked.results[0]!.category,
      openNow: ranked.results[0]!.openNow,
      lat: ranked.results[0]!.lat,
      lng: ranked.results[0]!.lng,
      etaParticipantA: ranked.results[0]!.etaParticipantA,
      etaParticipantB: ranked.results[0]!.etaParticipantB
    });

    sessions.confirmVenue({
      sessionId: created.sessionId,
      participantId: created.participantId,
      venueId: ranked.results[0]!.venueId
    });
    sessions.confirmVenue({
      sessionId: created.sessionId,
      participantId: created.participantId,
      venueId: ranked.results[0]!.venueId
    });

    const events = sessions.listFunnelEvents(created.sessionId);
    expect(events.map((item) => item.event)).toEqual([
      "session_start",
      "inputs_set",
      "results_returned",
      "decision_confirmed"
    ]);
    expect(events.filter((item) => item.event === "decision_confirmed")).toHaveLength(1);
  });
});

describe("analytics funnel route", () => {
  it("returns event records and completeness for existing session", async () => {
    const repository = new SessionRepository();
    const created = repository.createSession({ joinToken: "routefunnel123456", role: "host" });
    repository.recordFunnelEvent(created.sessionId, "inputs_set");
    repository.recordFunnelEvent(created.sessionId, "results_returned", { resultCount: 3 });
    repository.recordFunnelEvent(created.sessionId, "decision_confirmed", { venueId: "venue-1" });

    const response = await getSessionFunnelHandler(created.sessionId, { repository });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      sessionId: created.sessionId,
      completeness: {
        session_start: true,
        inputs_set: true,
        results_returned: true,
        decision_confirmed: true
      }
    });
  });

  it("returns 404 SESSION_NOT_FOUND for unknown session", async () => {
    const repository = new SessionRepository();
    const response = await getSessionFunnelHandler("missing-session", { repository });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "SESSION_NOT_FOUND" });
  });
});
