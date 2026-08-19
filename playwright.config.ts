import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8766",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-1440", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
    { name: "laptop-1024", use: { browserName: "chromium", viewport: { width: 1024, height: 768 } } },
    { name: "mobile-390", use: { browserName: "chromium", viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://127.0.0.1:8766/uiadapt_demo/",
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
  },
});
