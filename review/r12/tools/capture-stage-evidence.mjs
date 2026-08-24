/* global document, fetch, navigator, window */

import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { setTimeout } from "node:timers";
import { fileURLToPath, URL } from "node:url";

import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const EVIDENCE_DIR = path.join(ROOT, "review/r12/evidence");
const CHROME_BIN = process.env.CF_CHROME_BIN ?? "/home/ubuntu/opt/chrome145/chrome";
const EXPECTED_CHROME = "145.0.7632.117";
const STATES = Object.freeze([
  { key: "1", state: "EXPLORE" },
  { key: "2", state: "COMPARE" },
  { key: "3", state: "PURCHASE_INTENT" },
]);

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit", ...options });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code=${code} signal=${signal ?? "none"}`));
    });
  });
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Could not allocate a loopback preview port")));
        return;
      }
      const { port } = address;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForUrl(url, processHandle) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Static server exited before readiness with code ${processHandle.exitCode}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Preview has not bound its socket yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for static server: ${url}`);
}

async function stopProcess(processHandle) {
  if (!processHandle || processHandle.exitCode !== null) return;
  processHandle.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => processHandle.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  if (processHandle.exitCode === null) processHandle.kill("SIGKILL");
}

async function probeVideo(videoPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height:format=duration",
      "-of", "json",
      videoPath,
    ], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed: ${Buffer.concat(stderr).toString("utf8")}`));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(stdout).toString("utf8")));
      } catch (error) {
        reject(new Error("ffprobe returned invalid JSON", { cause: error }));
      }
    });
  });
}

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await run("npm", ["run", "build:nwg"]);

  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const stageUrl = `${origin}/uiadapt_demo/stage/`;
  const serveBin = path.join(ROOT, "node_modules/serve/build/main.js");
  const staticServer = spawn(process.execPath, [
    serveBin,
    "--no-clipboard",
    "--no-port-switching",
    "--listen", `tcp://127.0.0.1:${port}`,
    "www",
  ], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  staticServer.stdout.on("data", (chunk) => process.stderr.write(`[static] ${chunk}`));
  staticServer.stderr.on("data", (chunk) => process.stderr.write(`[static] ${chunk}`));

  let browser;
  try {
    await waitForUrl(stageUrl, staticServer);
    browser = await chromium.launch({
      executablePath: CHROME_BIN,
      headless: true,
      args: ["--no-sandbox", "--window-size=1920,1080"],
    });
    const chromeVersion = browser.version();
    if (chromeVersion !== EXPECTED_CHROME) {
      throw new Error(`Chrome identity mismatch: expected ${EXPECTED_CHROME}, got ${chromeVersion}`);
    }

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      colorScheme: "light",
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const externalRequests = [];
    const telemetryRequests = [];
    const pageErrors = [];
    const consoleErrors = [];

    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol !== "data:" && url.protocol !== "blob:" && url.origin !== origin) {
        externalRequests.push(request.url());
      }
      if (url.pathname.startsWith("/api/uiadapt/")) telemetryRequests.push(request.url());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(stageUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      userAgent: navigator.userAgent,
    }));
    if (viewport.width !== 1920 || viewport.height !== 1080 || viewport.dpr !== 1) {
      throw new Error(`Viewport contract failed: ${JSON.stringify(viewport)}`);
    }
    if (viewport.scrollWidth !== 1920 || viewport.scrollHeight !== 1080) {
      throw new Error(`Scroll contract failed during capture: ${JSON.stringify(viewport)}`);
    }
    if (!/HeadlessChrome\/145\.0\.0\.0\b/.test(viewport.userAgent)) {
      throw new Error(`User-Agent identity mismatch: ${viewport.userAgent}`);
    }

    for (const checkpoint of STATES) {
      await page.keyboard.press(checkpoint.key);
      await page.locator("#stage-root").waitFor({ state: "visible" });
      await page.waitForFunction(
        (state) => document.getElementById("stage-root")?.dataset.state === state,
        checkpoint.state,
      );
      await page.waitForTimeout(700);
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `stage-${checkpoint.state}.png`),
        fullPage: false,
        animations: "disabled",
      });
    }

    await page.getByRole("button", { name: "처음부터" }).click();
    await page.waitForFunction(() => document.getElementById("stage-root")?.dataset.elapsedMs === "0");
    const videoPath = path.join(EVIDENCE_DIR, "stage-27s.webm");
    await page.screencast.start({ path: videoPath, size: { width: 1920, height: 1080 } });
    await page.getByRole("button", { name: "▶ 27초 데모" }).click();
    await page.waitForFunction(
      () => document.getElementById("stage-root")?.dataset.demoComplete === "true",
      undefined,
      { timeout: 35_000 },
    );
    await page.screencast.stop();

    if (externalRequests.length > 0 || telemetryRequests.length > 0) {
      throw new Error(`Network contract failed: ${JSON.stringify({ externalRequests, telemetryRequests })}`);
    }
    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(`Browser errors observed: ${JSON.stringify({ pageErrors, consoleErrors })}`);
    }

    const probe = await probeVideo(videoPath);
    const stream = probe.streams?.[0];
    const duration = Number(probe.format?.duration);
    if (stream?.width !== 1920 || stream?.height !== 1080) {
      throw new Error(`Video dimensions must be 1920x1080: ${JSON.stringify(probe)}`);
    }
    if (!Number.isFinite(duration) || duration < 26.5 || duration > 30) {
      throw new Error(`Video duration is outside the untrimmed 27-second run: ${duration}`);
    }

    const result = {
      schema: "uiadapt-r12-stage-capture-v1",
      chromeVersion,
      viewport,
      screenshots: STATES.map(({ state }) => `review/r12/evidence/stage-${state}.png`),
      video: "review/r12/evidence/stage-27s.webm",
      videoDurationSeconds: duration,
      videoDimensions: { width: stream.width, height: stream.height },
      externalRequestCount: externalRequests.length,
      telemetryRequestCount: telemetryRequests.length,
      pageErrorCount: pageErrors.length,
      consoleErrorCount: consoleErrors.length,
    };
    await writeFile(
      path.join(EVIDENCE_DIR, "stage-capture.json"),
      `${JSON.stringify(result, null, 2)}\n`,
      "utf8",
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    await context.close();
  } finally {
    if (browser) await browser.close();
    await stopProcess(staticServer);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
