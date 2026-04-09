import { expect, test } from "@playwright/test";

test("keeps session flow synced when EventSource is unavailable", async ({ page }) => {
  const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

  await page.addInitScript(() => {
    window.EventSource = undefined as never;
  });

  await page.route("**/v1/sessions/demo-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "demo-session",
        status: "joined",
        updatedAt: "2026-01-01T10:00:00.000Z",
        inputsReady: true,
        shortlist: [],
        reactions: [],
        confirmedPlace: null,
        participants: [
          {
            participantId: "demo-host",
            role: "host",
            joinedAt: "2026-01-01T09:58:00.000Z",
            locationConfirmedAt: "2026-01-01T10:00:00.000Z"
          },
          {
            participantId: "demo-invitee",
            role: "invitee",
            joinedAt: "2026-01-01T09:59:00.000Z",
            locationConfirmedAt: "2026-01-01T10:00:00.000Z"
          }
        ]
      })
    });
  });

  let eventsPollCount = 0;
  await page.route("**/v1/sessions/demo-session/events**", async (route) => {
    eventsPollCount += 1;
    const events =
      eventsPollCount === 1
        ? [
            {
              eventType: "session_updated",
              sessionId: "demo-session",
              updatedAt: "2026-01-01T10:00:05.000Z",
              diff: {
                shortlist: [
                  {
                    venueId: "coffee-spot",
                    name: "Coffee Spot",
                    category: "cafe",
                    openNow: true,
                    lat: 40.72,
                    lng: -73.99,
                    etaParticipantA: 12,
                    etaParticipantB: 14,
                    addedByParticipantId: "demo-host",
                    addedAt: "2026-01-01T10:00:05.000Z"
                  }
                ]
              }
            }
          ]
        : [];

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ events })
    });
  });

  await page.goto(`${appUrl}/s/demo-token?asHost=1&sessionId=demo-session&participantId=demo-host`);

  await expect(page.getByText("Inputs ready for ranking.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm this place" })).toBeVisible();
});
