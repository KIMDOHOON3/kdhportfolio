import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1,
  outputDir: "output/playwright/results",
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder:
          process.env.PLAYWRIGHT_REPORT_DIR ?? "output/playwright/report",
        open: "never",
      },
    ],
    [
      "json",
      {
        outputFile:
          process.env.PLAYWRIGHT_RESULTS_FILE ??
          "output/playwright/results.json",
      },
    ],
  ],
  use: {
    baseURL: process.env.PORTFOLIO_URL ?? "http://localhost:3011",
    channel: "chrome",
    headless: true,
    reducedMotion: "no-preference",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 720 } } },
    { name: "compact-desktop", use: { viewport: { width: 687, height: 871 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: "small-mobile",
      use: {
        viewport: { width: 360, height: 640 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: "landscape",
      use: {
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
});
