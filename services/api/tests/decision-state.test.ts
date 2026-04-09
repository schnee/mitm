import { describe, expect, it } from "vitest";
import { SessionRepository } from "../src/modules/session/repository";

describe("decision state", () => {
  it("stores one shared shortlist entry", () => {
    const repository = new SessionRepository();
    const created = repository.createSession({ joinToken: "shortlist1234567890", role: "host" });
    repository.joinSession({ joinToken: "shortlist1234567890", role: "invitee" });

    const shortlist = repository.upsertShortlistVenue({
      sessionId: created.sessionId,
      participantId: created.participantId,
      venueId: "coffee-spot",
      name: "Coffee Spot",
      category: "cafe",
      openNow: true,
      etaParticipantA: 12,
      etaParticipantB: 14,
      lat: 40.72,
      lng: -73.99
    });

    expect(shortlist).toHaveLength(1);
    expect(shortlist[0]).toMatchObject({
      venueId: "coffee-spot",
      name: "Coffee Spot",
      category: "cafe",
      openNow: true,
      etaParticipantA: 12,
      etaParticipantB: 14
    });
  });

  it("updates existing shortlist item when venueId repeats", () => {
    const repository = new SessionRepository();
    const created = repository.createSession({ joinToken: "dedupe123456789012", role: "host" });
    repository.joinSession({ joinToken: "dedupe123456789012", role: "invitee" });

    repository.upsertShortlistVenue({
      sessionId: created.sessionId,
      participantId: created.participantId,
      venueId: "coffee-spot",
      name: "Coffee Spot",
      category: "cafe",
      openNow: true,
      etaParticipantA: 12,
      etaParticipantB: 14,
      lat: 40.72,
      lng: -73.99
    });

    const shortlist = repository.upsertShortlistVenue({
      sessionId: created.sessionId,
      participantId: created.participantId,
      venueId: "coffee-spot",
      name: "Coffee Spot Updated",
      category: "cafe",
      openNow: false,
      etaParticipantA: 13,
      etaParticipantB: 15,
      lat: 40.72,
      lng: -73.99
    });

    expect(shortlist).toHaveLength(1);
    expect(shortlist[0]?.name).toBe("Coffee Spot Updated");
    expect(shortlist[0]?.openNow).toBe(false);
  });

  it("exposes shared shortlist in getSessionSnapshot", () => {
    const repository = new SessionRepository();
    const created = repository.createSession({ joinToken: "snapshot1234567890", role: "host" });
    const joined = repository.joinSession({ joinToken: "snapshot1234567890", role: "invitee" });

    repository.upsertShortlistVenue({
      sessionId: created.sessionId,
      participantId: joined.participantId,
      venueId: "coffee-spot",
      name: "Coffee Spot",
      category: "cafe",
      openNow: true,
      etaParticipantA: 12,
      etaParticipantB: 14,
      lat: 40.72,
      lng: -73.99
    });

    const snapshot = repository.getSessionSnapshot(created.sessionId);
    expect(snapshot?.shortlist).toHaveLength(1);
    expect(snapshot?.shortlist[0]?.venueId).toBe("coffee-spot");
    expect(snapshot?.confirmedPlace).toBeNull();
  });
});
