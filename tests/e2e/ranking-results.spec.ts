import { expect, test } from "@playwright/test";

test("auto-ranking lifecycle renders shared results and retry messaging", async ({ page }) => {
  const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";
  const now = new Date().toISOString();

  const sharedResults = [
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
  ];

  await page.route("**/v1/sessions/demo-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "demo-session",
        status: "joined",
        updatedAt: now,
        inputsReady: true,
        rankingInputsReady: true,
        rankingLifecycle: {
          state: "waiting",
          lastErrorCode: null,
          generationRequestId: null
        },
        rankedResults: [],
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
      body: JSON.stringify({
        events: [
          {
            eventType: "session_updated",
            sessionId: "demo-session",
            updatedAt: "2026-01-01T10:06:00.000Z",
            diff: {
              rankingInputsReady: true,
              rankingLifecycle: {
                state: "generating",
                lastErrorCode: null,
                generationRequestId: "req-1"
              }
            }
          },
          {
            eventType: "session_updated",
            sessionId: "demo-session",
            updatedAt: "2026-01-01T10:07:00.000Z",
            diff: {
              rankingInputsReady: true,
              rankingLifecycle: {
                state: "ready",
                generatedAt: "2026-01-01T10:07:00.000Z",
                lastErrorCode: null,
                generationRequestId: "req-1"
              },
              rankedResults: sharedResults
            }
          }
        ]
      })
    });
  });

  await page.route("**/v1/ranking/inputs", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        split: "50_50",
        tags: ["coffee"],
        updatedAt: now,
        rankingInputsReady: true,
        rankingLifecycle: {
          state: "generating",
          lastErrorCode: null,
          generationRequestId: "req-1"
        }
      })
    });
  });

  let refreshAttempts = 0;
  await page.route("**/v1/ranking/results", async (route) => {
    refreshAttempts += 1;
    if (refreshAttempts === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: "RANKING_GENERATION_FAILED",
          retryable: true,
          message: "Saved location and ranking inputs are preserved. Retry with Refresh ranking."
        })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "demo-session",
        generatedAt: "2026-01-01T10:08:00.000Z",
        results: sharedResults,
        mode: "refresh"
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

  await expect(page.getByRole("button", { name: "Run ranking" })).toHaveCount(0);
  await expect(page.getByText("shared ranking is ready", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Save ranking inputs" }).click();
  await expect(page.getByText("shared ranking is ready", { exact: false })).toBeVisible();

  await expect(page.getByText("Fairness delta:", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pass" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to shortlist" })).toBeVisible();

  await page.getByRole("button", { name: "Refresh ranking" }).click();
  await expect(page.getByText("Saved locations and ranking inputs are still preserved", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Refresh ranking" }).click();
  await expect(page.getByText("shared ranking refreshed", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Accept" }).click();
  await page.getByRole("button", { name: "Add to shortlist" }).click();
  await expect(page.getByText("Shared shortlist", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm this place" })).toBeVisible();
});
