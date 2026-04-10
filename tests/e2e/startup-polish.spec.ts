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

  await expect(page.getByRole("heading", { name: "Meet Me In The Middle" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create session" })).toBeVisible();

  await page.getByRole("button", { name: "Create session" }).click();

  await expect(page.getByText("Loading: creating your shared session now.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy invite link" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue as host" })).toBeVisible();
  await expect(page.getByText("Copy the invite link and send it to the other person", { exact: false })).toBeVisible();
});
