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
const { chromium } = require("playwright");
(async () => {
  const raw = readFileSync("/etc/uiadapt-demo/password", "utf8");
  const password = raw.endsWith("\r\n") ? raw.slice(0, -2) : raw.endsWith("\n") ? raw.slice(0, -1) : raw;
  const origin = "https://00-new-world-gpu.tail645adc.ts.net";
  const events = { console: [], responses: [], failed: [], pageerror: [] };
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true });
  const context = await browser.newContext({
    httpCredentials: { username: "reviewer", password, origin, send: "unauthorized" },
    ignoreHTTPSErrors: false,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("console", m => { if (m.type() === "error") events.console.push({ text: m.text(), url: m.location().url || "" }); });
  page.on("response", r => { if (r.status() >= 400) events.responses.push({ status: r.status(), url: r.url() }); });
  page.on("requestfailed", r => events.failed.push({ url: r.url(), reason: r.failure()?.errorText || "" }));
  page.on("pageerror", e => events.pageerror.push({ name: e.name, message: e.message }));
  const response = await page.goto(origin + "/uiadapt_demo/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);
  console.log("DIAGNOSTIC_HTTP_STATUS=" + (response?.status() ?? 0));
  console.log("DIAGNOSTIC_EVENTS=" + JSON.stringify(events));
  await context.close();
  await browser.close();
})();
NODE
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"