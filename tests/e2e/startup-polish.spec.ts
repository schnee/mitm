import { expect, test } from "@playwright/test";

test("startup screen shows polished hierarchy and state transitions", async ({ page }) => {
  const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

  await page.route("**/v1/sessions", async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "demo-session",
        joinUrl: "/s/demo-token",
        participantId: "demo-host"
      })
    });
  });

  await page.goto(appUrl);

  await expect(page.getByRole("heading", { name: "Meet halfway without the back-and-forth." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create session" })).toBeVisible();

  await page.getByRole("button", { name: "Create session" }).click();

  await expect(page.getByText("Loading: creating your shared session now.")).toBeVisible();
  await expect(page.getByText("Session ID:", { exact: false })).toBeVisible();
  await expect(page.getByText("Invitee Join URL:", { exact: false })).toBeVisible();
  await expect(page.getByText("Host Continue URL:", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue as host" })).toBeVisible();
});
