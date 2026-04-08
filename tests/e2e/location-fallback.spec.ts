import { test, expect } from "@playwright/test";

test("manual entry fallback works after geolocation denial", async ({ page, context }) => {
  const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";
  await context.grantPermissions([], { origin: appUrl });
  await page.goto(`${appUrl}/s/demo-token`);

  await expect(page.getByText("Location capture")).toBeVisible();
  await expect(page.getByText("Use manual entry below to continue", { exact: false })).toBeVisible();

  await page.getByPlaceholder("Address label").fill("123 Main St");
  await page.getByPlaceholder("Latitude").fill("40.7128");
  await page.getByPlaceholder("Longitude").fill("-74.0060");
  await page.getByRole("button", { name: "Save manual location" }).click();
  await page.getByRole("button", { name: "Confirm location" }).click();

  await expect(page.getByText("Location confirmed at", { exact: false })).toBeVisible();
});
