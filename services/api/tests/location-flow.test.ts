import { describe, expect, it } from "vitest";
import { SessionRepository } from "../src/modules/session/repository";
import { LocationRepository } from "../src/modules/location/repository";
import { upsertLocationDraftHandler } from "../src/routes/location/upsertLocationDraft";
import { confirmLocationHandler } from "../src/routes/location/confirmLocation";

describe("location flow", () => {
  it("draft endpoint accepts geolocation and manual payloads", async () => {
    const sessions = new SessionRepository();
    const locations = new LocationRepository(sessions);
    const created = sessions.createSession({ joinToken: "locdraft1234567890", role: "host" });

    const geolocation = await upsertLocationDraftHandler(
      {
        mode: "geolocation",
        sessionId: created.sessionId,
        participantId: created.participantId,
        lat: 40.7128,
        lng: -74.006,
        addressLabel: "Current location"
      },
      { repository: locations }
    );
    expect(geolocation.status).toBe(200);

    const manual = await upsertLocationDraftHandler(
      {
        mode: "manual",
        sessionId: created.sessionId,
        participantId: created.participantId,
        lat: 34.0522,
        lng: -118.2437,
        addressLabel: "Typed address"
      },
      { repository: locations }
    );
    expect(manual.status).toBe(200);
  });

  it("confirm endpoint sets confirmedAt only if draft exists", async () => {
    const sessions = new SessionRepository();
    const locations = new LocationRepository(sessions);
    const created = sessions.createSession({ joinToken: "locconfirm1234567890", role: "host" });

    const failFirst = await confirmLocationHandler(
      { sessionId: created.sessionId, participantId: created.participantId },
      { repository: locations }
    );
    expect(failFirst.status).toBe(409);

    await upsertLocationDraftHandler(
      {
        mode: "manual",
        sessionId: created.sessionId,
        participantId: created.participantId,
        lat: 1,
        lng: 2,
        addressLabel: "Address"
      },
      { repository: locations }
    );

    const success = await confirmLocationHandler(
      { sessionId: created.sessionId, participantId: created.participantId },
      { repository: locations }
    );
    expect(success.status).toBe(200);
  });

  it("session inputsReady is true only when both participants confirmed", async () => {
    const sessions = new SessionRepository();
    const locations = new LocationRepository(sessions);
    const created = sessions.createSession({ joinToken: "ready1234567890", role: "host" });
    const joined = sessions.joinSession({ joinToken: "ready1234567890", role: "invitee" });

    await upsertLocationDraftHandler(
      {
        mode: "manual",
        sessionId: created.sessionId,
        participantId: created.participantId,
        lat: 10,
        lng: 11,
        addressLabel: "Host"
      },
      { repository: locations }
    );
    await confirmLocationHandler(
      { sessionId: created.sessionId, participantId: created.participantId },
      { repository: locations }
    );
    expect(sessions.getSessionSnapshot(created.sessionId)?.inputsReady).toBe(false);

    await upsertLocationDraftHandler(
      {
        mode: "manual",
        sessionId: created.sessionId,
        participantId: joined.participantId,
        lat: 12,
        lng: 13,
        addressLabel: "Invitee"
      },
      { repository: locations }
    );
    await confirmLocationHandler(
      { sessionId: created.sessionId, participantId: joined.participantId },
      { repository: locations }
    );

    const snapshot = sessions.getSessionSnapshot(created.sessionId);
    expect(snapshot?.inputsReady).toBe(true);
    expect(snapshot?.status).toBe("locating");
  });
});
