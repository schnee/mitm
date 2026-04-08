import { describe, expect, it } from "vitest";
import { SessionDomainError, SessionRepository } from "../src/modules/session/repository";
import { createSessionHandler } from "../src/routes/sessions/createSession";
import { joinSessionHandler } from "../src/routes/sessions/joinSession";

describe("session repository", () => {
  it("createSession returns sessionId/joinToken/host participant and persists created status", () => {
    const repository = new SessionRepository();
    const result = repository.createSession({ joinToken: "abc1234567890token", role: "host" });

    expect(result.sessionId).toBeTruthy();
    expect(result.joinToken).toBe("abc1234567890token");
    expect(result.participantId).toBeTruthy();

    const persisted = repository.getSessionById(result.sessionId);
    expect(persisted?.status).toBe("created");
    expect(repository.getParticipants(result.sessionId)).toHaveLength(1);
    expect(repository.getParticipants(result.sessionId)[0]?.role).toBe("host");
  });

  it("joinSession with valid token creates invitee participant without account identity", () => {
    const repository = new SessionRepository();
    const created = repository.createSession({ joinToken: "valid1234567890token", role: "host" });

    const joined = repository.joinSession({ joinToken: "valid1234567890token", role: "invitee" });

    expect(joined.sessionId).toBe(created.sessionId);
    const participants = repository.getParticipants(created.sessionId);
    expect(participants).toHaveLength(2);
    expect(participants[1]?.role).toBe("invitee");
    expect(participants[1]?.accountId).toBeNull();
  });

  it("joinSession rejects expired, full, and unknown token with stable errors", () => {
    const repository = new SessionRepository();

    try {
      repository.joinSession({ joinToken: "unknown1234567890", role: "invitee" });
      throw new Error("expected joinSession to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(SessionDomainError);
      expect((error as SessionDomainError).code).toBe("SESSION_NOT_FOUND");
    }

    repository.seedSession({
      sessionId: "expired-session",
      joinToken: "expired1234567890",
      expiresAt: new Date(Date.now() - 1000).toISOString()
    });
    try {
      repository.joinSession({ joinToken: "expired1234567890", role: "invitee" });
      throw new Error("expected joinSession to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(SessionDomainError);
      expect((error as SessionDomainError).code).toBe("SESSION_EXPIRED");
    }

    const full = repository.createSession({ joinToken: "full1234567890token", role: "host" });
    repository.joinSession({ joinToken: "full1234567890token", role: "invitee" });
    try {
      repository.joinSession({ joinToken: "full1234567890token", role: "invitee" });
      throw new Error("expected joinSession to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(SessionDomainError);
      expect((error as SessionDomainError).code).toBe("SESSION_FULL");
    }
    expect(repository.getParticipants(full.sessionId)).toHaveLength(2);
  });
});

describe("session routes", () => {
  it("POST /v1/sessions returns 201 and absolute join URL", async () => {
    const repository = new SessionRepository();
    const response = await createSessionHandler(
      { role: "host" },
      { repository, appUrl: "https://meet.example.com" }
    );

    expect(response.status).toBe(201);
    if (response.status === 201) {
      const body = response.body as { joinUrl: string; sessionId: string; participantId: string };
      expect(body.joinUrl.startsWith("https://meet.example.com/s/")).toBe(true);
      expect(body.sessionId).toBeTruthy();
      expect(body.participantId).toBeTruthy();
    }
  });

  it("POST /v1/sessions/join maps full and expired to 409/410", async () => {
    const repository = new SessionRepository();
    repository.seedSession({
      sessionId: "expired-route",
      joinToken: "expiredroute12345",
      expiresAt: new Date(Date.now() - 1000).toISOString()
    });

    const expired = await joinSessionHandler(
      { joinToken: "expiredroute12345", role: "invitee" },
      { repository }
    );
    expect(expired.status).toBe(410);

    repository.createSession({ joinToken: "fullroute123456789", role: "host" });
    await joinSessionHandler({ joinToken: "fullroute123456789", role: "invitee" }, { repository });
    const full = await joinSessionHandler({ joinToken: "fullroute123456789", role: "invitee" }, { repository });

    expect(full.status).toBe(409);
  });
});
