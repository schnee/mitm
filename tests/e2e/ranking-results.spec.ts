import { expect, test } from "@playwright/test";

test("shows ETA, category, and open status", async ({ page }) => {
  const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

  await page.route("**/v1/sessions/demo-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "demo-session",
        status: "joined",
        updatedAt: new Date().toISOString(),
        inputsReady: true,
        shortlist: [],
        reactions: [],
        confirmedPlace: null,
        participants: [
          {
            participantId: "demo-host",
            role: "host",
            joinedAt: "2026-01-01T10:00:00.000Z",
            locationConfirmedAt: "2026-01-01T10:02:00.000Z"
          },
          {
            participantId: "demo-invitee",
            role: "invitee",
            joinedAt: "2026-01-01T10:01:00.000Z",
            locationConfirmedAt: "2026-01-01T10:03:00.000Z"
          }
        ]
      })
    });
  });

  await page.route("**/v1/sessions/demo-session/events**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ events: [] })
    });
  });

  await page.route("**/v1/ranking/inputs", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        split: "50_50",
        tags: ["coffee"],
        updatedAt: new Date().toISOString()
      })
    });
  });

  await page.route("**/v1/ranking/results", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "demo-session",
        generatedAt: new Date().toISOString(),
        results: [
          {
            venueId: "venue-1",
            name: "Coffee Spot",
            lat: 40.72,
            lng: -73.99,
            category: "cafe",
            openNow: true,
            etaParticipantA: 12,
            etaParticipantB: 14,
            fairnessScore: 0.93,
            preferenceScore: 0.9,
            totalScore: 0.92,
            fairnessDeltaMinutes: 2
          }
        ]
      })
    });
  });

  await page.goto(`${appUrl}/s/demo-token?asHost=1&sessionId=demo-session&participantId=demo-host`);

  await page.getByRole("button", { name: "Save ranking inputs" }).click();
  await page.getByRole("button", { name: "Run ranking" }).click();

  await expect(page.getByText("ETA (You):", { exact: false })).toBeVisible();
  await expect(page.getByText("ETA (Partner):", { exact: false })).toBeVisible();
  await expect(page.getByText("Category:", { exact: false })).toBeVisible();
  await expect(page.getByText("Open now", { exact: false })).toBeVisible();
});
