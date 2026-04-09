import { expect, test } from "@playwright/test";

test("shows polished ranking readability and actions", async ({ page }) => {
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

  await page.route("**/v1/decision/reaction", async (route) => {
    const requestBody = route.request().postDataJSON() as {
      participantId: string;
      reaction: "accept" | "pass";
      venueId: string;
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reaction: {
          venueId: requestBody.venueId,
          acceptCount: requestBody.reaction === "accept" ? 1 : 0,
          passCount: requestBody.reaction === "pass" ? 1 : 0,
          reactionsByParticipant: {
            [requestBody.participantId]: requestBody.reaction
          }
        }
      })
    });
  });

  await page.route("**/v1/decision/shortlist", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        shortlist: [
          {
            venueId: "venue-1",
            name: "Coffee Spot",
            category: "cafe",
            openNow: true,
            lat: 40.72,
            lng: -73.99,
            etaParticipantA: 12,
            etaParticipantB: 14,
            addedByParticipantId: "demo-host",
            addedAt: "2026-01-01T10:10:00.000Z"
          }
        ]
      })
    });
  });

  await page.goto(`${appUrl}/s/demo-token?asHost=1&sessionId=demo-session&participantId=demo-host`);

  await page.getByRole("button", { name: "Save ranking inputs" }).click();
  await page.getByRole("button", { name: "Run ranking" }).click();

  await expect(page.getByText("Fairness delta:", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pass" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to shortlist" })).toBeVisible();

  await page.getByRole("button", { name: "Accept" }).click();
  await page.getByRole("button", { name: "Add to shortlist" }).click();
  await expect(page.getByText("Shared shortlist", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm this place" })).toBeVisible();
});
