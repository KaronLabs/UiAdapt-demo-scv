set -Eeuo pipefail
set +x
DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
TARGET="e076d9f90af1cd897842383780053595c8654170"
PREVIOUS="fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91"
STAGING="$DEPLOY_ROOT/releases/$TARGET.staging"
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
test -d "$STAGING/node_modules/playwright"
cd "$STAGING"
sudo -n /usr/bin/node <<'NODE'
const { readFileSync } = require("node:fs");
const { chromium } = require("playwright");
(async () => {
  let browser;
  try {
    const raw = readFileSync("/etc/uiadapt-demo/password", "utf8");
    const password = raw.endsWith("\r\n") ? raw.slice(0, -2) : raw.endsWith("\n") ? raw.slice(0, -1) : raw;
    if (password.length === 0) process.exit(2);
    const origin = "https://00-new-world-gpu.tail645adc.ts.net";
    const url = origin + "/uiadapt_demo/";
    const expectedFavicon = origin + "/favicon.ico";
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const notFoundResponses = [];
    const externalRequests = [];
    browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      httpCredentials: { username: "reviewer", password, origin, send: "unauthorized" },
      ignoreHTTPSErrors: false,
      reducedMotion: "reduce",
      recordVideo: undefined,
    });
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push({ text: message.text(), url: message.location().url || "" });
    });
    page.on("pageerror", () => pageErrors.push(1));
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
    });
    page.on("requestfailed", (request) => failedRequests.push(request.url()));
    page.on("response", (response) => {
      if (response.status() === 404) notFoundResponses.push(response.url());
    });
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const status = response?.status() ?? 0;
    await page.getByRole("heading", { name: "같은 상품을, 더 나은 판단으로." }).waitFor({ state: "visible" });
    const states = [];
    const readState = () => page.locator('[data-current="true"] strong').textContent();
    states.push((await readState())?.trim() ?? "MISSING");
    await page.clock.install();
    await page.getByTestId("live-demo-cta").click();
    await page.clock.fastForward(7000);
    states.push((await readState())?.trim() ?? "MISSING");
    await page.clock.fastForward(14000);
    states.push((await readState())?.trim() ?? "MISSING");
    const sequence = states.join(">");
    const noObservedResponse404 = notFoundResponses.length === 0;
    const faviconConsoleOnly = consoleErrors.length === 1
      && consoleErrors[0].url === expectedFavicon
      && /404/.test(consoleErrors[0].text)
      && /Failed to load resource/i.test(consoleErrors[0].text);
    const passed = status === 200
      && sequence === "EXPLORE>COMPARE>FOCUS"
      && pageErrors.length === 0
      && failedRequests.length === 0
      && externalRequests.length === 0
      && noObservedResponse404
      && faviconConsoleOnly;
    console.log("R3_BROWSER_HTTP_STATUS=" + status);
    console.log("R3_STATE_SEQUENCE=" + sequence);
    console.log("R3_CONSOLE_ERRORS=" + consoleErrors.length);
    console.log("R3_PAGE_ERRORS=" + pageErrors.length);
    console.log("R3_FAILED_REQUESTS=" + failedRequests.length);
    console.log("R3_HTTP_404=" + notFoundResponses.length);
    console.log("R3_EXTERNAL_RUNTIME_REQUESTS=" + externalRequests.length);
    console.log("R3_ALLOWED_FAVICON_404=" + (noObservedResponse404 && faviconConsoleOnly ? "PASS" : "FAIL"));
    console.log("R3_BROWSER_RESULT=" + (passed ? "PASS" : "FAIL"));
    await context.close();
    await browser.close();
    process.exit(passed ? 0 : 1);
  } catch {
    console.log("R3_BROWSER_RESULT=FAIL");
    if (browser) await browser.close().catch(() => {});
    process.exit(1);
  }
})();
NODE
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
printf 'R3_POINTER_UNCHANGED=PASS\n'