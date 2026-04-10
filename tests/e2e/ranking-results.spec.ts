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
  let rankingInputsSubmitted = false;

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
            locationConfirmedAt: null
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
    if (!rankingInputsSubmitted) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ events: [] })
      });
      return;
    }

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
    rankingInputsSubmitted = true;
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

  await page.route("**/v1/location/draft", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ expireAt: "2026-01-01T11:00:00.000Z" })
    });
  });

  await page.route("**/v1/location/confirm", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        confirmedAt: "2026-01-01T10:04:00.000Z",
        inputsReady: true
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
          message: "Saved locations and meet-up preferences are preserved. Retry with Refresh suggestions."
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

  await expect(page.locator(".guided-stepper")).toBeVisible();
  await expect(page.getByText("Your turn", { exact: false })).toBeVisible();
  await expect(page.locator(".next-action-button")).toHaveCount(1);
  await expect(page.locator('[data-step-id="location"][data-step-active="true"]')).toBeVisible();
  await expect(page.locator('[data-step-id="preferences"][data-step-active="true"]')).toHaveCount(0);

  await page.getByLabel("Address label").fill("Downtown");
  await page.getByLabel("Latitude").fill("30.271371");
  await page.getByLabel("Longitude").fill("-97.759000");
  await page.getByRole("button", { name: "Save manual location" }).click();
  await page.getByRole("button", { name: "Confirm location" }).click();

  await expect(page.locator('[data-step-id="preferences"][data-step-active="true"]')).toBeVisible();
  await expect(page.getByText("Location: Confirmed", { exact: false })).toBeVisible();

  await expect(page.getByRole("button", { name: "Run ranking" })).toHaveCount(0);

  await page.getByRole("button", { name: "Save meet-up preferences" }).click();
  await expect(page.locator('[data-step-id="spots"][data-step-active="true"]')).toBeVisible();

  await page.getByRole("button", { name: "Refresh suggestions" }).click();
  await expect(page.getByText("Saved locations and meet-up preferences are still preserved", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Refresh suggestions" }).click();
  expect(refreshAttempts).toBeGreaterThanOrEqual(2);

  await expect(page.locator('[data-step-id="shortlist"][data-step-active="true"]')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Spots: 1 available", { exact: false })).toBeVisible();
  await expect(page.getByText("Shared shortlist", { exact: false })).toBeVisible();
});
