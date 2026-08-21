set -Eeuo pipefail
set +x
DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
TARGET="e076d9f90af1cd897842383780053595c8654170"
PREVIOUS="fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91"
STAGING="$DEPLOY_ROOT/releases/$TARGET.staging"
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
cd "$STAGING"
sudo -n /usr/bin/node <<'NODE'
const { readFileSync } = require("node:fs");
const { spawn } = require("node:child_process");
const http = require("node:http");
const net = require("node:net");
const { chromium } = require("playwright");

const getPort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.once("error", reject);
  s.listen(0, "127.0.0.1", () => {
    const port = s.address().port;
    s.close(err => err ? reject(err) : resolve(port));
  });
});
const status = url => new Promise((resolve, reject) => {
  const req = http.get(url, { signal: AbortSignal.timeout(10000) }, res => {
    res.resume();
    res.on("end", () => resolve({ code: res.statusCode || 0, headers: res.headers }));
  });
  req.on("error", reject);
});
const waitStatus = async (url, wanted) => {
  for (let i = 0; i < 100; i++) {
    try { const r = await status(url); if (r.code === wanted) return r; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("readiness timeout");
};
const terminate = child => new Promise(resolve => {
  if (!child || child.exitCode !== null) return resolve();
  child.once("exit", () => resolve());
  child.kill("SIGTERM");
  setTimeout(() => { if (child.exitCode === null) child.kill("SIGKILL"); }, 3000).unref();
});

(async () => {
  let staticChild, gatewayChild, browser;
  try {
    const raw = readFileSync("/etc/uiadapt-demo/password", "utf8");
    const password = raw.endsWith("\r\n") ? raw.slice(0, -2) : raw.endsWith("\n") ? raw.slice(0, -1) : raw;
    if (!password) process.exit(2);
    const staticPort = await getPort();
    let gatewayPort = await getPort();
    while (gatewayPort === staticPort) gatewayPort = await getPort();
    staticChild = spawn("./node_modules/.bin/serve", ["--no-clipboard","--no-port-switching","--listen","tcp://127.0.0.1:" + staticPort,"www"], { stdio: ["ignore","ignore","ignore"] });
    gatewayChild = spawn("/usr/bin/node", ["scripts/password-gateway.mjs"], {
      env: { ...process.env, UIADAPT_GATEWAY_PASSWORD_FILE: "/etc/uiadapt-demo/password", UIADAPT_GATEWAY_PORT: String(gatewayPort), UIADAPT_GATEWAY_UPSTREAM: "http://127.0.0.1:" + staticPort },
      stdio: ["ignore","ignore","ignore"],
    });
    await waitStatus("http://127.0.0.1:" + staticPort + "/uiadapt_demo/", 200);
    const unauth = await waitStatus("http://127.0.0.1:" + gatewayPort + "/uiadapt_demo/", 401);
    const origin = "http://127.0.0.1:" + gatewayPort;
    const url = origin + "/uiadapt_demo/";
    const consoleErrors = [], pageErrors = [], failed = [], notFound = [], external = [];
    browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      httpCredentials: { username: "reviewer", password, origin, send: "unauthorized" },
      reducedMotion: "reduce",
      ignoreHTTPSErrors: false,
    });
    const page = await context.newPage();
    page.on("console", m => { if (m.type() === "error") consoleErrors.push(1); });
    page.on("pageerror", () => pageErrors.push(1));
    page.on("requestfailed", () => failed.push(1));
    page.on("response", r => { if (r.status() === 404) notFound.push(1); });
    page.on("request", r => { if (new URL(r.url()).origin !== origin) external.push(1); });
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const pageStatus = response?.status() ?? 0;
    const iconHref = await page.locator('link[rel~="icon"]').getAttribute("href");
    if (!iconHref) throw new Error("favicon link missing");
    const iconUrl = new URL(iconHref, url).href;
    const iconResponse = await context.request.get(iconUrl);
    const iconStatus = iconResponse.status();
    const iconType = (iconResponse.headers()["content-type"] || "").split(";")[0].trim().toLowerCase();
    const iconBody = await iconResponse.text();
    const iconNonHtml = !/<!doctype html|<html/i.test(iconBody);
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
    const passed = unauth.code === 401 && pageStatus === 200
      && iconStatus === 200 && iconType === "image/svg+xml" && iconNonHtml
      && sequence === "EXPLORE>COMPARE>FOCUS"
      && consoleErrors.length === 0 && pageErrors.length === 0
      && failed.length === 0 && notFound.length === 0 && external.length === 0;
    console.log("CANDIDATE_UNAUTH_STATUS=" + unauth.code);
    console.log("CANDIDATE_AUTH_STATUS=" + pageStatus);
    console.log("CANDIDATE_FAVICON_STATUS=" + iconStatus);
    console.log("CANDIDATE_FAVICON_TYPE=" + iconType);
    console.log("CANDIDATE_FAVICON_NON_HTML=" + (iconNonHtml ? "PASS" : "FAIL"));
    console.log("CANDIDATE_STATE_SEQUENCE=" + sequence);
    console.log("CANDIDATE_CONSOLE_ERRORS=" + consoleErrors.length);
    console.log("CANDIDATE_PAGE_ERRORS=" + pageErrors.length);
    console.log("CANDIDATE_FAILED_REQUESTS=" + failed.length);
    console.log("CANDIDATE_HTTP_404=" + notFound.length);
    console.log("CANDIDATE_EXTERNAL_RUNTIME_REQUESTS=" + external.length);
    console.log("CANDIDATE_BROWSER_RESULT=" + (passed ? "PASS" : "FAIL"));
    await context.close();
    await browser.close(); browser = null;
    await Promise.all([terminate(gatewayChild), terminate(staticChild)]);
    console.log("CANDIDATE_CHILD_PROCESSES_TERMINATED=PASS");
    process.exit(passed ? 0 : 1);
  } catch {
    console.log("CANDIDATE_BROWSER_RESULT=FAIL");
    if (browser) await browser.close().catch(() => {});
    await Promise.all([terminate(gatewayChild), terminate(staticChild)]);
    process.exit(1);
  }
})();
NODE
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
printf 'CANDIDATE_POINTER_UNCHANGED=PASS\n'