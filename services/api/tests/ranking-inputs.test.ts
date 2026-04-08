import { describe, expect, it } from "vitest";
import { RankingRepository } from "../src/modules/ranking/repository";
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
    expect(valid.body).toMatchObject({ split: "50_50", tags: ["coffee", "dessert"] });
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
