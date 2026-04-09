import { expect, test } from "@playwright/test";

test("completes full funnel and validates telemetry completeness", async ({ page }) => {
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
            venueId: "coffee-spot",
            name: "Coffee Spot",
            category: "cafe",
            openNow: true,
            lat: 40.72,
            lng: -73.99,
            etaParticipantA: 12,
            etaParticipantB: 14
          }
        ]
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
            venueId: "coffee-spot",
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

  await page.route("**/v1/decision/confirm", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        confirmedPlace: {
          venueId: "coffee-spot",
          name: "Coffee Spot",
          category: "cafe",
          lat: 40.72,
          lng: -73.99,
          navigationUrl: "https://www.google.com/maps/search/?api=1&query=40.72,-73.99",
          confirmedByParticipantId: "demo-host",
          confirmedAt: "2026-01-01T10:12:00.000Z"
        }
      })
    });
  });

  await page.route("**/v1/analytics/funnel/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "demo-session",
        events: [
          { sessionId: "demo-session", event: "session_start", occurredAt: "2026-01-01T10:00:00.000Z" },
          { sessionId: "demo-session", event: "inputs_set", occurredAt: "2026-01-01T10:03:00.000Z" },
          { sessionId: "demo-session", event: "results_returned", occurredAt: "2026-01-01T10:09:00.000Z" },
          { sessionId: "demo-session", event: "decision_confirmed", occurredAt: "2026-01-01T10:12:00.000Z" }
        ],
        completeness: {
          session_start: true,
          inputs_set: true,
          results_returned: true,
          decision_confirmed: true
        }
      })
    });
  });

  await page.goto(`${appUrl}/s/demo-token?asHost=1&sessionId=demo-session&participantId=demo-host`);

  await page.getByRole("button", { name: "Save ranking inputs" }).click();
  await page.getByRole("button", { name: "Run ranking" }).click();
  await page.getByRole("button", { name: "Add to shortlist" }).click();
  await page.getByRole("button", { name: "Confirm this place" }).click();

  await expect(page.getByRole("link", { name: "Open in Maps" })).toBeVisible();

  const funnelPayload = await page.evaluate(async () => {
    const response = await fetch("http://localhost:8080/v1/analytics/funnel/demo-session");
    return (await response.json()) as {
      completeness: {
        session_start: boolean;
        inputs_set: boolean;
        results_returned: boolean;
        decision_confirmed: boolean;
      };
    };
  });

  expect(funnelPayload.completeness).toEqual({
    session_start: true,
    inputs_set: true,
    results_returned: true,
    decision_confirmed: true
  });
});
