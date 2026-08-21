import { execFileSync } from "node:child_process";
import { chromium, expect, request as playwrightRequest } from "@playwright/test";

const startedAtUtc = new Date().toISOString();
const expectedSha = "fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91";
const releaseRoot = "/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo";
const origin = "https://00-new-world-gpu.tail645adc.ts.net";
const nestedPath = "/uiadapt_demo/";
const username = process.env.UIADAPT_PUBLIC_USER;
const password = process.env.UIADAPT_PUBLIC_PASSWORD;

if (!username || !password) {
  throw new Error("Missing in-memory public credentials");
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

const localSha = run("git", ["rev-parse", "HEAD"]);
const remoteBranch = run("git", ["ls-remote", "origin", "refs/heads/codex/uiadapt-investor-stage"]);
const remoteSha = remoteBranch.split(/\s+/)[0];
const currentRelease = run("ssh", ["nwg", `readlink -f ${releaseRoot}/current`]);
const funnelStatus = JSON.parse(run("ssh", ["nwg", "tailscale funnel status --json"]));
const expectedRelease = `${releaseRoot}/releases/${expectedSha}`;

ensure(localSha === expectedSha, "Local HEAD does not match the adjudicated SHA");
ensure(remoteSha === expectedSha, "GitHub branch does not match the adjudicated SHA");
ensure(currentRelease === expectedRelease, "nwg current release does not match the adjudicated SHA");

const mappings = {
  uiadapt443: funnelStatus.Web?.["00-new-world-gpu.tail645adc.ts.net:443"]?.Handlers?.["/"]?.Proxy,
  preserved8443: funnelStatus.Web?.["00-new-world-gpu.tail645adc.ts.net:8443"]?.Handlers?.["/"]?.Proxy,
  preserved8787: funnelStatus.Web?.["00-new-world-gpu.tail645adc.ts.net:8787"]?.Handlers?.["/"]?.Proxy,
};
ensure(mappings.uiadapt443 === "http://127.0.0.1:4180", "443 mapping changed");
ensure(mappings.preserved8443 === "http://127.0.0.1:8101", "8443 mapping changed");
ensure(mappings.preserved8787 === "http://127.0.0.1:8787", "8787 mapping changed");

const authProof = {};
const unauthenticated = await playwrightRequest.newContext({ baseURL: origin });
authProof.unauthenticatedNested = (await unauthenticated.get(nestedPath, { maxRedirects: 0 })).status();
await unauthenticated.dispose();

const incorrect = await playwrightRequest.newContext({
  baseURL: origin,
  httpCredentials: { username, password: "deliberately-incorrect-credential" },
});
authProof.incorrectCredentialNested = (await incorrect.get(nestedPath, { maxRedirects: 0 })).status();
await incorrect.dispose();

const authenticated = await playwrightRequest.newContext({
  baseURL: origin,
  httpCredentials: { username, password },
});
const rootResponse = await authenticated.get("/", { maxRedirects: 0 });
authProof.authenticatedRoot = rootResponse.status();
authProof.rootLocation = rootResponse.headers().location ?? null;
authProof.authenticatedNested = (await authenticated.get(nestedPath, { maxRedirects: 0 })).status();
await authenticated.dispose();

ensure(authProof.unauthenticatedNested === 401, "Unauthenticated request was not 401");
ensure(authProof.incorrectCredentialNested === 401, "Incorrect credential request was not 401");
ensure(authProof.authenticatedRoot === 302, "Authenticated root request was not 302");
ensure(authProof.rootLocation === nestedPath, "Authenticated root redirect target changed");
ensure(authProof.authenticatedNested === 200, "Authenticated nested request was not 200");

const browser = await chromium.launch({ headless: true });
const viewportContracts = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "laptop-1024", width: 1024, height: 768 },
  { name: "mobile-390", width: 390, height: 844 },
];
const viewportProof = [];

for (const viewport of viewportContracts) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    httpCredentials: { username, password },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const externalRequests = [];
  const errorResponses = [];
  const assetResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => failedRequests.push(request.url()));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin) externalRequests.push(request.url());
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (response.status() >= 400) errorResponses.push({ status: response.status(), url: response.url() });
    if (url.pathname.startsWith("/uiadapt_demo/assets/")) {
      assetResponses.push({ status: response.status(), url: response.url() });
    }
  });

  const navigation = await page.goto(origin + nestedPath, { waitUntil: "networkidle" });
  ensure(navigation?.status() === 200, `${viewport.name} navigation was not 200`);
  await expect(page.getByText("특허 출원 기반 적응형 UI 인프라", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "같은 상품을, 더 나은 판단으로." })).toBeVisible();
  await expect(page.getByText("추천은 WHAT을 결정합니다. UIAdapt는 HOW를 조율합니다.", { exact: true })).toBeVisible();
  await expect(page.getByTestId("live-demo-cta")).toHaveText(/27초 라이브 데모/);
  for (const text of ["Same catalog", "Same behavior", "Different presentation"]) {
    await expect(page.getByTestId("product-invariants")).toContainText(text);
  }
  for (const text of ["Behavior", "State", "Policy", "Interface"]) {
    await expect(page.getByTestId("causal-trace")).toContainText(text);
  }

  await page.evaluate(() => document.fonts.ready);
  const fontProof = await page.evaluate(() => {
    const normalize = (value) => value.replace(/["']/g, "").trim();
    const face = Array.from(document.fonts.values()).find(
      (candidate) => normalize(candidate.family) === "Wanted Sans Variable",
    );
    let cssRuleFound = false;
    for (const sheet of Array.from(document.styleSheets)) {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSFontFaceRule && normalize(rule.style.fontFamily) === "Wanted Sans Variable") {
          cssRuleFound = true;
        }
      }
    }
    return {
      cssRuleFound,
      status: face?.status ?? "missing",
      check: document.fonts.check('16px "Wanted Sans Variable"'),
    };
  });
  ensure(fontProof.cssRuleFound && fontProof.status === "loaded" && fontProof.check, `${viewport.name} Wanted Sans failed`);

  const wantedWoff2 = assetResponses.filter(
    ({ status, url }) => status === 200 && /WantedSansVariable[^/]*\.woff2(?:\?|$)/.test(url),
  ).length;
  const javascript = assetResponses.filter(({ status, url }) => status === 200 && /\.js(?:\?|$)/.test(url)).length;
  const stylesheet = assetResponses.filter(({ status, url }) => status === 200 && /\.css(?:\?|$)/.test(url)).length;
  ensure(wantedWoff2 >= 1, `${viewport.name} WantedSansVariable WOFF2 200 missing`);
  ensure(javascript >= 1, `${viewport.name} JavaScript 200 missing`);
  ensure(stylesheet >= 1, `${viewport.name} stylesheet 200 missing`);

  const overflow = () => page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  const exploreOverflow = await overflow();
  ensure(exploreOverflow <= 0, `${viewport.name} EXPLORE overflow`);

  await page.clock.install();
  await page.getByTestId("live-demo-cta").click();
  await page.clock.fastForward(7_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("COMPARE");
  await expect(page.locator(".demo-stage .comparison-panel.is-visible")).toBeVisible();
  const compareOverflow = await overflow();
  ensure(compareOverflow <= 0, `${viewport.name} COMPARE overflow`);

  await page.clock.fastForward(14_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("FOCUS");
  await expect(page.locator(".decision-support")).toBeVisible();
  await expect(page.locator(".comparison-panel.is-visible")).toHaveCount(0);
  const focusOverflow = await overflow();
  ensure(focusOverflow <= 0, `${viewport.name} FOCUS overflow`);

  ensure(consoleErrors.length === 0, `${viewport.name} console errors: ${JSON.stringify(consoleErrors)}`);
  ensure(failedRequests.length === 0, `${viewport.name} request failures: ${JSON.stringify(failedRequests)}`);
  ensure(externalRequests.length === 0, `${viewport.name} external requests: ${JSON.stringify(externalRequests)}`);
  ensure(errorResponses.length === 0, `${viewport.name} HTTP 4xx/5xx: ${JSON.stringify(errorResponses)}`);

  viewportProof.push({
    viewport: viewport.name,
    navigationStatus: navigation.status(),
    exactInvestorCopy: true,
    liveDemoCta: true,
    causalTrace: ["Behavior", "State", "Policy", "Interface"],
    invariants: ["Same catalog", "Same behavior", "Different presentation"],
    wantedSans: { ...fontProof, woff2Status200Count: wantedWoff2 },
    assetStatus200Count: { javascript, stylesheet },
    states: { compareAtMs: 7000, compare: "COMPARE", focusAtMs: 21000, focus: "FOCUS" },
    overflowPx: { explore: exploreOverflow, compare: compareOverflow, focus: focusOverflow },
    hygieneCounts: {
      consoleErrors: consoleErrors.length,
      failedRequests: failedRequests.length,
      externalRequests: externalRequests.length,
      http4xx5xx: errorResponses.length,
    },
  });
  await context.close();
}

await browser.close();

console.log(JSON.stringify({
  schemaVersion: 1,
  evidenceType: "independent-public-runtime-smoke",
  startedAtUtc,
  completedAtUtc: new Date().toISOString(),
  reviewerRelationship: {
    verifier: "independent review subagent",
    implementationAuthor: "different agent",
    deploymentOperator: "different root agent",
    mutationAuthority: "none; read-only public verification",
  },
  sourceBinding: { expectedSha, localSha, remoteSha, currentRelease },
  funnelMappings: mappings,
  auth: authProof,
  viewports: viewportProof,
  verdict: "PUBLIC_SMOKE_PASS",
}, null, 2));
