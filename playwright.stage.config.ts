import { constants } from "node:fs";
import { access } from "node:fs/promises";
import process from "node:process";
import { defineConfig } from "@playwright/test";

const chromePath = process.env.CF_CHROME_BIN;
if (!chromePath) throw new Error("CF_CHROME_BIN is required for the Chrome 145 Stage gate");
await access(chromePath, constants.X_OK);

export default defineConfig({
  testDir: "./e2e",
  testMatch: "stage-mode.contract.ts",
  outputDir: "./test-results/stage",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report/stage", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8766",
    browserName: "chromium",
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath: chromePath,
      args: ["--window-size=1920,1080"],
    },
  },
  projects: [{ name: "stage-chrome145" }],
  webServer: {
    command: "npm run build:nwg && serve --no-clipboard --no-port-switching --listen tcp://127.0.0.1:8766 www",
    url: "http://127.0.0.1:8766/uiadapt_demo/stage/",
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
  },
});
