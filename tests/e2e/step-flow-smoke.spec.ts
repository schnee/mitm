import { expect, test } from "@playwright/test";

test.describe("Step Flow Smoke Test", () => {
  test("spots step does NOT complete when results exist - shortlist step should be required", async ({ page }) => {
    const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

    await page.route("**/v1/sessions/smoke-session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sessionId: "smoke-session",
          status: "ranked",
          updatedAt: new Date().toISOString(),
          inputsReady: true,
          rankingInputsReady: true,
          rankingLifecycle: {
            state: "ready",
            generatedAt: "2026-01-15T10:00:00.000Z"
          },
          rankedResults: [
            { venueId: "v1", name: "Venue 1", category: "cafe", lat: 40.7, lng: -74.0, etaParticipantA: 10, etaParticipantB: 10, fairnessScore: 0.9, preferenceScore: 0.9, totalScore: 0.9, fairnessDeltaMinutes: 0 },
            { venueId: "v2", name: "Venue 2", category: "bar", lat: 40.71, lng: -74.01, etaParticipantA: 12, etaParticipantB: 12, fairnessScore: 0.85, preferenceScore: 0.85, totalScore: 0.85, fairnessDeltaMinutes: 0 }
          ],
          shortlist: [],
          reactions: [],
          confirmedPlace: null,
          participants: [
            { participantId: "host", role: "host", joinedAt: "2026-01-15T09:00:00.000Z", locationConfirmedAt: "2026-01-15T09:01:00.000Z", rankingInputsUpdatedAt: "2026-01-15T09:02:00.000Z" },
            { participantId: "invitee", role: "invitee", joinedAt: "2026-01-15T09:00:00.000Z", locationConfirmedAt: "2026-01-15T09:01:00.000Z", rankingInputsUpdatedAt: "2026-01-15T09:02:00.000Z" }
          ]
        })
      });
    });

    await page.route("**/v1/sessions/smoke-session/events**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events: [] }) });
    });

    await page.goto(`${appUrl}/s/smoke-token?asHost=1&sessionId=smoke-session&participantId=host`);

    await expect(page.getByRole("heading", { name: "Ranked spots", exact: true })).toBeVisible();
    
    const addToShortlistBtn = page.getByRole("button", { name: "Add to shortlist" });
    await expect(addToShortlistBtn.first()).toBeVisible();

    await addToShortlistBtn.first().click();

    await expect(page.getByRole("heading", { name: "Shared shortlist" })).toBeVisible();
  });

  test("adding to shortlist does NOT immediately complete confirm step", async ({ page }) => {
    const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

    await page.route("**/v1/sessions/smoke2-session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sessionId: "smoke2-session",
          status: "ranked",
          updatedAt: new Date().toISOString(),
          inputsReady: true,
          rankingInputsReady: true,
          rankingLifecycle: { state: "ready", generatedAt: "2026-01-15T10:00:00.000Z" },
          rankedResults: [
            { venueId: "v1", name: "Venue 1", category: "cafe", lat: 40.7, lng: -74.0, etaParticipantA: 10, etaParticipantB: 10, fairnessScore: 0.9, preferenceScore: 0.9, totalScore: 0.9, fairnessDeltaMinutes: 0 }
          ],
          shortlist: [],
          reactions: [],
          confirmedPlace: null,
          participants: [
            { participantId: "host", role: "host", joinedAt: "2026-01-15T09:00:00.000Z", locationConfirmedAt: "2026-01-15T09:01:00.000Z", rankingInputsUpdatedAt: "2026-01-15T09:02:00.000Z" },
            { participantId: "invitee", role: "invitee", joinedAt: "2026-01-15T09:00:00.000Z", locationConfirmedAt: "2026-01-15T09:01:00.000Z", rankingInputsUpdatedAt: "2026-01-15T09:02:00.000Z" }
          ]
        })
      });
    });

    await page.route("**/v1/sessions/smoke2-session/events**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events: [] }) });
    });

    await page.goto(`${appUrl}/s/smoke2-token?asHost=1&sessionId=smoke2-session&participantId=host`);

    await expect(page.getByRole("heading", { name: "Ranked spots", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add to shortlist" }).first().click();

    const shortlistHeading = page.getByRole("heading", { name: "Shared shortlist" });
    await expect(shortlistHeading).toBeVisible();

    const confirmHeading = page.getByRole("heading", { name: "Confirm place" });
    await expect(confirmHeading).not.toBeVisible();
  });
});