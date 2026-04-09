import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_APP_URL ?? "http://localhost:3000"
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "Desktop Safari",
      use: { ...devices["Desktop Safari"] }
    },
    {
      name: "Pixel 5",
      use: { ...devices["Pixel 5"] }
    },
    {
      name: "iPhone 12",
      use: { ...devices["iPhone 12"] }
    }
  ]
});
