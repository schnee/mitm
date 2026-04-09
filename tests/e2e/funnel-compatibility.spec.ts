import { expect, test } from "@playwright/test";

test("completes full funnel and validates telemetry completeness", async ({ page }) => {
  const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";
  let reactionState = {
    venueId: "coffee-spot",
    acceptCount: 0,
    passCount: 0,
    reactionsByParticipant: {} as Record<string, "accept" | "pass">
  };

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
            venueId: "coffee-spot",
            name: "Coffee Spot",
            category: "cafe",
            openNow: true,
            lat: 40.72,
            lng: -73.99,
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
    reactionState = {
      venueId: requestBody.venueId,
      acceptCount: requestBody.reaction === "accept" ? 1 : 0,
      passCount: requestBody.reaction === "pass" ? 1 : 0,
      reactionsByParticipant: {
        [requestBody.participantId]: requestBody.reaction
      }
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reaction: reactionState
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
        },
        interactionSummary: {
          reactionCount: 2,
          acceptCount: 1,
          passCount: 1,
          firstReactionAt: "2026-01-01T10:09:30.000Z",
          firstShortlistAt: "2026-01-01T10:10:00.000Z",
          reactionToShortlistSeconds: 30
        }
      })
    });
  });

  await page.goto(`${appUrl}/s/demo-token?asHost=1&sessionId=demo-session&participantId=demo-host`);

  const saveInputsButton = page.getByRole("button", { name: "Save ranking inputs" });
  await saveInputsButton.focus();
  await expect(saveInputsButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Success: ranking inputs saved.")).toBeVisible();

  await page.getByRole("button", { name: "Run ranking" }).click();
  await expect(page.getByText("Fairness delta: 2 min")).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pass" })).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();
  await page.getByRole("button", { name: "Pass" }).click();
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
      interactionSummary: {
        reactionCount: number;
        acceptCount: number;
        passCount: number;
        firstReactionAt: string | null;
        firstShortlistAt: string | null;
        reactionToShortlistSeconds: number | null;
      };
    };
  });

  expect(funnelPayload.completeness).toEqual({
    session_start: true,
    inputs_set: true,
    results_returned: true,
    decision_confirmed: true
  });
  expect(funnelPayload.interactionSummary).toMatchObject({
    reactionCount: 2,
    acceptCount: 1,
    passCount: 1
  });
});
