import { describe, expect, it } from "vitest";
import { SessionRepository } from "../src/modules/session/repository";
import { confirmVenueHandler } from "../src/routes/decision/confirmVenue";
import { upsertShortlistVenueHandler } from "../src/routes/decision/upsertShortlistVenue";

function createRankedSession() {
  const repository = new SessionRepository();
  const created = repository.createSession({ joinToken: "decision1234567890", role: "host" });
  const joined = repository.joinSession({ joinToken: "decision1234567890", role: "invitee" });
  repository.updateSessionStatus(created.sessionId, "locating");
  repository.updateSessionStatus(created.sessionId, "ranked");
  return { repository, created, joined };
}

describe("decision routes", () => {
  it("accepts valid shortlist payload", async () => {
    const { repository, created } = createRankedSession();

    const response = await upsertShortlistVenueHandler(
      {
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
      },
      { repository }
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      shortlist: [
        {
          venueId: "coffee-spot",
          name: "Coffee Spot"
        }
      ]
    });
  });

  it("rejects invalid shortlist payload", async () => {
    const { repository, created } = createRankedSession();
    const response = await upsertShortlistVenueHandler(
      {
        sessionId: created.sessionId,
        participantId: created.participantId,
        venueId: "coffee-spot"
      },
      { repository }
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "INVALID_DECISION_PAYLOAD" });
  });

  it("returns session not found for unknown participant", async () => {
    const { repository, created } = createRankedSession();
    const response = await confirmVenueHandler(
      {
        sessionId: created.sessionId,
        participantId: "missing-participant",
        venueId: "coffee-spot"
      },
      { repository }
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "SESSION_NOT_FOUND" });
  });

  it("rejects conflicting second confirmation", async () => {
    const { repository, created } = createRankedSession();
    await upsertShortlistVenueHandler(
      {
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
      },
      { repository }
    );
    await upsertShortlistVenueHandler(
      {
        sessionId: created.sessionId,
        participantId: created.participantId,
        venueId: "park-cafe",
        name: "Park Cafe",
        category: "cafe",
        openNow: true,
        etaParticipantA: 14,
        etaParticipantB: 12,
        lat: 40.71,
        lng: -73.98
      },
      { repository }
    );

    const first = await confirmVenueHandler(
      {
        sessionId: created.sessionId,
        participantId: created.participantId,
        venueId: "coffee-spot"
      },
      { repository }
    );
    expect(first.status).toBe(200);

    const idempotent = await confirmVenueHandler(
      {
        sessionId: created.sessionId,
        participantId: created.participantId,
        venueId: "coffee-spot"
      },
      { repository }
    );
    expect(idempotent.status).toBe(200);

    const conflicting = await confirmVenueHandler(
      {
        sessionId: created.sessionId,
        participantId: created.participantId,
        venueId: "park-cafe"
      },
      { repository }
    );
    expect(conflicting.status).toBe(409);
    expect(conflicting.body).toEqual({ error: "PLACE_ALREADY_CONFIRMED" });
  });
});
