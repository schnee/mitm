import { test, expect } from "@playwright/test";

test("manual entry fallback works after geolocation denial", async ({ page, context }) => {
  const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

  await page.route("**/v1/sessions/join", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "demo-session",
        participantId: "demo-participant"
      })
    });
  });

  await page.route("**/v1/sessions/demo-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "demo-session",
        status: "joined",
        updatedAt: new Date().toISOString(),
        inputsReady: false,
        shortlist: [],
        reactions: [],
        confirmedPlace: null,
        participants: [
          {
            participantId: "demo-participant",
            role: "invitee",
            joinedAt: "2026-01-01T10:01:00.000Z",
            locationConfirmedAt: null
          },
          {
            participantId: "demo-host",
            role: "host",
            joinedAt: "2026-01-01T10:00:00.000Z",
            locationConfirmedAt: null
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

  await page.route("**/v1/location/draft", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ expireAt: "2026-01-01T12:00:00.000Z" })
    });
  });

  await page.route("**/v1/location/confirm", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ confirmedAt: "2026-01-01T10:06:00.000Z", inputsReady: false })
    });
  });

  await context.grantPermissions([], { origin: appUrl });
  await page.goto(`${appUrl}/s/demo-token`);

  await expect(page.getByText("Location capture")).toBeVisible();

  await page.getByRole("button", { name: "Use current location" }).click();
  await expect(page.getByText("Error: geolocation issue", { exact: false })).toBeVisible();

  await page.getByPlaceholder("Address label").fill("123 Main St");
  await page.getByPlaceholder("Latitude").fill("40.7128");
  await page.getByPlaceholder("Longitude").fill("-74.0060");
  await page.getByRole("button", { name: "Save manual location" }).click();
  await expect(page.getByText("Success: manual location draft saved.")).toBeVisible();
  await page.getByRole("button", { name: "Confirm location" }).click();

  await expect(page.getByText("Success: location confirmed at", { exact: false })).toBeVisible();
});
