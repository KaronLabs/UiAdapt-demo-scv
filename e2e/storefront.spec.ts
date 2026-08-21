import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const expectedPrices = ["₩329,000", "₩279,000", "₩199,000"];
const expectedProducts = [
  { id: "aurora-one", name: "Aurora One", price: 329000, rating: 4.8, reviews: 284, batteryHours: 40, anc: "Hybrid ANC", weightGrams: 254, shipping: "내일 무료배송", inventory: 18, colors: ["Graphite", "Sand", "Cobalt"], tagline: "깊은 정숙함, 넓게 열린 사운드.", detail: "정교한 공간감과 장시간 청취를 위한 플래그십 오버이어." },
  { id: "nova-pro", name: "Nova Pro", price: 279000, rating: 4.7, reviews: 198, batteryHours: 36, anc: "Adaptive ANC", weightGrams: 238, shipping: "2일 내 무료배송", inventory: 24, colors: ["Carbon", "Silver"], tagline: "움직임에 맞춰 조율되는 선명함.", detail: "도시의 소음에 반응하는 경량 퍼포먼스 헤드폰." },
  { id: "halo-air", name: "Halo Air", price: 199000, rating: 4.6, reviews: 352, batteryHours: 30, anc: "Standard ANC", weightGrams: 218, shipping: "오늘 출고", inventory: 31, colors: ["Ivory", "Midnight", "Coral"], tagline: "가볍게 쓰고, 오래 듣는 리듬.", detail: "매일의 이동을 위한 가볍고 균형 잡힌 무선 헤드폰." },
];

async function productContracts(page: Page) {
  return page.locator(".product-card").evaluateAll((cards) =>
    cards.map((card) => JSON.parse((card as HTMLElement).dataset.productContract ?? "null")),
  );
}

async function settleVisualEvidence(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => document.fonts.ready);
}

type EvidencePage = Page & {
  __consoleErrors?: string[];
  __externalRequests?: string[];
  __failedRequests?: string[];
  __assetResponses?: Array<{ url: string; status: number }>;
  __assetFailures?: string[];
};

async function wantedFontEvidence(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const family = "Wanted Sans Variable";
    const normalize = (value: string) => value.replace(/["']/g, "").trim();
    const cssRuleFound = Array.from(document.styleSheets).some((sheet) =>
      Array.from(sheet.cssRules).some(
        (rule) => rule instanceof CSSFontFaceRule && normalize(rule.style.fontFamily) === family,
      ),
    );
    const loadedFace = Array.from(document.fonts.values()).find(
      (face) => normalize(face.family) === family,
    );
    return { cssRuleFound, status: loadedFace?.status ?? "missing" };
  });
}

async function productGridBalance(page: Page) {
  return page.evaluate(() => {
    const grid = document.querySelector<HTMLElement>(".product-grid")!.getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".product-card"));
    const last = cards.at(-1)!.getBoundingClientRect();
    return {
      centerDelta: Math.abs(last.left + last.width / 2 - (grid.left + grid.width / 2)),
      widthRatio: last.width / grid.width,
    };
  });
}

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = [];
  const externalRequests: string[] = [];
  const failedRequests: string[] = [];
  const assetResponses: Array<{ url: string; status: number }> = [];
  const assetFailures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  page.on("requestfailed", (request) => failedRequests.push(request.url()));
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith("/uiadapt_demo/assets/")) {
      assetResponses.push({ url: response.url(), status: response.status() });
      if (response.status() >= 400) assetFailures.push(`${response.status()} ${response.url()}`);
    }
  });
  const evidencePage = page as EvidencePage;
  evidencePage.__consoleErrors = consoleErrors;
  evidencePage.__externalRequests = externalRequests;
  evidencePage.__failedRequests = failedRequests;
  evidencePage.__assetResponses = assetResponses;
  evidencePage.__assetFailures = assetFailures;
  await page.goto("/uiadapt_demo/");
  await expect(page.getByRole("heading", { name: "같은 상품을, 더 나은 판단으로." })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  const evidencePage = page as EvidencePage;
  expect(evidencePage.__consoleErrors ?? []).toEqual([]);
  expect(evidencePage.__externalRequests ?? []).toEqual([]);
  expect(evidencePage.__failedRequests ?? []).toEqual([]);
  expect(evidencePage.__assetFailures ?? []).toEqual([]);
});

test("storefront is responsive, local-only, and diagnostics are collapsed", async ({ page }, testInfo) => {
  await settleVisualEvidence(page);
  await expect(page.getByText("Developer View")).toBeVisible();
  await expect(page.locator(".developer-view")).not.toHaveAttribute("open", "");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-explore.png`, fullPage: true, animations: "disabled" });
  await page.screenshot({ path: `test-results/${testInfo.project.name}-explore-viewport.png`, animations: "disabled" });
});

test("investor stage uses the local Wanted Sans type scale and causal thesis", async ({ page }) => {
  await settleVisualEvidence(page);
  await expect(page.getByTestId("product-invariants")).toContainText("Same catalog");
  await expect(page.getByTestId("causal-trace")).toContainText("Behavior");
  await expect(page.getByTestId("causal-trace")).toContainText("Interface");
  expect(await wantedFontEvidence(page)).toEqual({ cssRuleFound: true, status: "loaded" });
  expect(
    ((page as EvidencePage).__assetResponses ?? []).some(
      ({ url, status }) => /WantedSansVariable[^/]*\.woff2(?:\?|$)/.test(url) && status === 200,
    ),
  ).toBe(true);

  const typeScale = await page.evaluate(() => {
    const px = (selector: string, property: "fontSize" | "lineHeight" = "fontSize") => {
      const node = document.querySelector<HTMLElement>(selector);
      if (!node) throw new Error(`Missing typography contract node: ${selector}`);
      return Number.parseFloat(getComputedStyle(node)[property]);
    };
    return {
      hero: px(".hero h1"),
      heroLine: px(".hero h1", "lineHeight"),
      section: px(".storefront__heading h2"),
      product: px(".product-card h2"),
      price: px(".product-card__price .text-action"),
      body: px(".hero__lead"),
      spec: px(".product-card__specs dd"),
      button: px(".product-card__actions .button"),
      bodyFamily: getComputedStyle(document.body).fontFamily,
      heroFamily: getComputedStyle(document.querySelector<HTMLElement>(".hero h1")!).fontFamily,
      buttonFamily: getComputedStyle(document.querySelector<HTMLElement>(".button--watch")!).fontFamily,
      diagnosticFamily: getComputedStyle(document.querySelector<HTMLElement>(".causal-trace span")!).fontFamily,
    };
  });
  expect(typeScale.hero).toBeGreaterThanOrEqual(52);
  expect(typeScale.heroLine / typeScale.hero).toBeGreaterThanOrEqual(1.07);
  expect(typeScale.heroLine / typeScale.hero).toBeLessThanOrEqual(1.09);
  expect(typeScale.section).toBeGreaterThanOrEqual(36);
  expect(typeScale.section).toBeLessThanOrEqual(48);
  expect(typeScale.product).toBeGreaterThanOrEqual(26);
  expect(typeScale.product).toBeLessThanOrEqual(30);
  expect(typeScale.price).toBeGreaterThanOrEqual(20);
  expect(typeScale.price).toBeLessThanOrEqual(22);
  expect(typeScale.body).toBeGreaterThanOrEqual(15);
  expect(typeScale.body).toBeLessThanOrEqual(17);
  expect(typeScale.spec).toBeGreaterThanOrEqual(13);
  expect(typeScale.spec).toBeLessThanOrEqual(14);
  expect(typeScale.button).toBeGreaterThanOrEqual(13);
  expect(typeScale.button).toBeLessThanOrEqual(14);
  expect(typeScale.bodyFamily).toContain("Wanted Sans Variable");
  expect(typeScale.heroFamily).toContain("Wanted Sans Variable");
  expect(typeScale.buttonFamily).toContain("Wanted Sans Variable");
  expect(typeScale.diagnosticFamily).toContain("IBM Plex Mono");

  const heroRegionsOverlap = await page.evaluate(() => {
    const first = document.querySelector<HTMLElement>(".hero__copy")!.getBoundingClientRect();
    const second = document.querySelector<HTMLElement>(".hero__console")!.getBoundingClientRect();
    return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
  });
  expect(heroRegionsOverlap).toBe(false);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("reviewed layout keeps laptop cards balanced and mobile evidence controls intact", async ({ page }, testInfo) => {
  await settleVisualEvidence(page);
  if (testInfo.project.name === "laptop-1024") {
    const balance = await productGridBalance(page);
    expect(balance.centerDelta).toBeLessThanOrEqual(1);
    expect(balance.widthRatio).toBeGreaterThanOrEqual(0.45);
    expect(balance.widthRatio).toBeLessThanOrEqual(0.55);
  }
  if (testInfo.project.name === "mobile-390") {
    const summaryAction = await page.locator(".why-panel .summary-action").evaluate((node) => {
      const style = getComputedStyle(node);
      return { whiteSpace: style.whiteSpace, flexShrink: style.flexShrink };
    });
    expect(summaryAction).toEqual({ whiteSpace: "nowrap", flexShrink: "0" });
  }
});

test("reviewed text contrast remains WCAG AA in inactive and FOCUS-muted states", async ({ page }) => {
  await page.clock.install();
  const contrastFor = (selector: string, backgroundSelector: string) => page.evaluate(
    ({ selector, backgroundSelector }) => {
      const node = document.querySelector<HTMLElement>(selector)!;
      const background = document.querySelector<HTMLElement>(backgroundSelector)!;
      const channels = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const foreground = channels(getComputedStyle(node).color);
      const backgroundColor = channels(getComputedStyle(background).backgroundColor);
      let opacity = 1;
      for (let current: HTMLElement | null = node; current; current = current.parentElement) {
        opacity *= Number.parseFloat(getComputedStyle(current).opacity);
      }
      const effective = foreground.map((channel, index) => channel * opacity + backgroundColor[index] * (1 - opacity));
      const luminance = (rgb: number[]) => rgb
        .map((channel) => channel / 255)
        .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
        .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      const light = Math.max(luminance(effective), luminance(backgroundColor));
      const dark = Math.min(luminance(effective), luminance(backgroundColor));
      return (light + 0.05) / (dark + 0.05);
    },
    { selector, backgroundSelector },
  );

  const inactiveStateContrast = await contrastFor(
    ".state-step:not(.is-current):not(.is-past) strong",
    ":root",
  );
  await page.getByTestId("live-demo-cta").click();
  await page.clock.fastForward(21_000);
  const mutedBodyContrast = await contrastFor(
    ".product-card--muted .product-card__detail",
    ".product-card--muted",
  );
  expect.soft(inactiveStateContrast).toBeGreaterThanOrEqual(4.5);
  expect.soft(mutedBodyContrast).toBeGreaterThanOrEqual(4.5);
});

test("nested deployment path loads assets, reloads, and runs the replay", async ({ page }) => {
  await page.goto("/uiadapt_demo/");
  await expect(page.getByRole("heading", { name: "같은 상품을, 더 나은 판단으로." })).toBeVisible();
  const scriptSource = await page.locator('script[type="module"]').getAttribute("src");
  expect(scriptSource).toMatch(/^\/uiadapt_demo\//);
  const stylesheetSource = await page.locator('link[rel="stylesheet"]').getAttribute("href");
  expect(stylesheetSource).toMatch(/^\/uiadapt_demo\//);
  await settleVisualEvidence(page);
  expect(await wantedFontEvidence(page)).toEqual({ cssRuleFound: true, status: "loaded" });
  await page.reload();
  await settleVisualEvidence(page);
  const assetResponses = (page as EvidencePage).__assetResponses ?? [];
  expect(assetResponses.some(({ url }) => url.endsWith(".js"))).toBe(true);
  expect(assetResponses.some(({ url }) => url.endsWith(".css"))).toBe(true);
  expect(assetResponses.some(({ url, status }) => /WantedSansVariable[^/]*\.woff2(?:\?|$)/.test(url) && status === 200)).toBe(true);
  expect((page as EvidencePage).__assetFailures ?? []).toEqual([]);
  await page.clock.install();
  await page.getByTestId("live-demo-cta").click();
  await page.clock.fastForward(7_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("COMPARE");
});

test("production index declares and serves a local favicon at the nested base", async ({ page }) => {
  const favicon = page.locator('link[rel~="icon"]');
  await expect(favicon).toHaveAttribute("type", "image/svg+xml");
  await expect(favicon).toHaveAttribute("href", "/uiadapt_demo/favicon.svg");

  const response = await page.request.get("/uiadapt_demo/favicon.svg");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  expect(await response.text()).not.toMatch(/<html/i);
});

test("the canonical replay changes presentation without changing product data", async ({ page }, testInfo) => {
  await page.clock.install();
  await settleVisualEvidence(page);
  const initialPrices = await page.locator(".product-card__price").allTextContents();
  expect(initialPrices.map((value) => value.trim())).toEqual(expectedPrices);
  expect(await productContracts(page)).toEqual(expectedProducts);
  if (testInfo.project.name === "laptop-1024") {
    const balance = await productGridBalance(page);
    expect(balance.centerDelta).toBeLessThanOrEqual(1);
    expect(balance.widthRatio).toBeGreaterThanOrEqual(0.45);
    expect(balance.widthRatio).toBeLessThanOrEqual(0.55);
  }
  await page.getByTestId("live-demo-cta").click();
  await page.clock.fastForward(7_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("COMPARE");
  await expect(page.locator(".product-grid")).toHaveAttribute("data-state", "COMPARE");
  expect(await productContracts(page)).toEqual(expectedProducts);
  if (testInfo.project.name === "laptop-1024") {
    const balance = await productGridBalance(page);
    expect(balance.centerDelta).toBeLessThanOrEqual(1);
  }
  if (testInfo.project.name === "desktop-1440") {
    const comparePanel = page.locator(".comparison-panel.is-visible");
    const box = await comparePanel.boundingBox();
    const viewportHeight = page.viewportSize()!.height;
    const visibleHeight = box ? Math.max(0, Math.min(viewportHeight, box.y + box.height) - Math.max(0, box.y)) : 0;
    expect(visibleHeight).toBeGreaterThanOrEqual(Math.min(240, (box?.height ?? 0) * 0.6));
  }
  await page.screenshot({ path: `test-results/${testInfo.project.name}-compare.png`, fullPage: true, animations: "disabled" });
  await page.screenshot({ path: `test-results/${testInfo.project.name}-compare-viewport.png`, animations: "disabled" });
  await page.clock.fastForward(14_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("FOCUS");
  await expect(page.locator(".product-grid")).toHaveAttribute("data-state", "FOCUS");
  expect((await page.locator(".product-card__price").allTextContents()).map((value) => value.trim())).toEqual(expectedPrices);
  expect(await productContracts(page)).toEqual(expectedProducts);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-focus.png`, fullPage: true, animations: "disabled" });
  await page.screenshot({ path: `test-results/${testInfo.project.name}-focus-viewport.png`, animations: "disabled" });
});

test("COMPARE is visible in the main stage and FOCUS becomes decision support", async ({ page }, testInfo) => {
  await page.clock.install();
  await page.getByTestId("live-demo-cta").click();
  await page.clock.fastForward(7_000);
  const comparePanel = page.locator(".demo-stage .comparison-panel.is-visible");
  await expect(comparePanel).toBeVisible();
  const compareBox = await comparePanel.boundingBox();
  expect(compareBox).not.toBeNull();
  if (testInfo.project.name === "desktop-1440") {
    expect(compareBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(900);
  }
  await page.clock.fastForward(14_000);
  await expect(page.locator(".comparison-panel.is-visible")).toHaveCount(0);
  await expect(page.locator(".decision-support")).toBeVisible();
  await expect(page.getByText("Aurora One").first()).toBeVisible();
});

test("UIAdapt and the sample merchant are named separately", async ({ page }) => {
  await expect(page.getByRole("link", { name: "UIAdapt 홈" })).toBeVisible();
  await expect(page.locator(".site-header")).toContainText("Adaptive UI Infrastructure");
  await expect(page.locator(".site-header .cart-button")).toHaveCount(0);
  await expect(page.locator(".demo-stage__header")).toContainText("샘플 상점 · Atelier Audio");
  await expect(page.locator(".demo-stage .cart-button")).toBeVisible();
});

test("Adaptive OFF keeps the same detected state but baseline presentation", async ({ page }) => {
  await page.clock.install();
  const exploreDescription = await page.locator(".storefront__heading > p").textContent();
  await page.getByRole("checkbox", { name: /Adaptive UI/i }).uncheck();
  await page.getByTestId("live-demo-cta").click();
  await page.clock.fastForward(21_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("FOCUS");
  await expect(page.locator(".product-grid")).toHaveAttribute("data-state", "EXPLORE");
  await expect(page.locator(".storefront__heading > p")).toHaveText(exploreDescription ?? "");
  expect(await productContracts(page)).toEqual(expectedProducts);
});

test("active product control survives the comparison transition", async ({ page }) => {
  await page.clock.install();
  await page.getByTestId("live-demo-cta").click();
  const price = page.getByRole("button", { name: "Aurora One 가격 확인" });
  await price.focus();
  await expect(price).toBeFocused();
  await page.clock.fastForward(7_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("COMPARE");
  await expect(price).toBeFocused();
});

test("keyboard-only path starts, pauses, resets, and records a product action", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (let index = 0; index < 3; index += 1) await page.keyboard.press("Tab");
  await expect(page.getByTestId("live-demo-cta")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("replay-status")).toContainText("동일한 행동 시퀀스");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Pause" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("replay-status")).toContainText("일시 정지");
  await expect(page.locator(".product-card").first()).toHaveCSS("transition-duration", "0s");

  await page.goto("/uiadapt_demo/");
  for (let index = 0; index < 3; index += 1) await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  for (let index = 0; index < 3; index += 1) await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Reset" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("replay-status")).toContainText("직접 둘러보거나");

  await page.goto("/uiadapt_demo/");
  for (let index = 0; index < 6; index += 1) await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Aurora One 가격 확인" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("event-count")).toHaveText("1");
});

test("Pause and Resume preserve virtual progress", async ({ page }) => {
  await page.clock.install();
  await page.getByTestId("live-demo-cta").click();
  await page.clock.fastForward(7_000);
  await page.getByRole("button", { name: "Pause" }).click();
  await page.clock.fastForward(20_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("COMPARE");
  await page.getByRole("button", { name: "Resume" }).click();
  await page.clock.fastForward(14_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("FOCUS");
});

test("Reset cancels every stale Replay timer", async ({ page }) => {
  await page.clock.install();
  await page.getByTestId("live-demo-cta").click();
  await page.clock.fastForward(3_000);
  await page.getByRole("button", { name: "Reset" }).click();
  await page.clock.fastForward(30_000);
  await page.getByText("Developer View").click();
  await expect(page.getByTestId("event-count")).toHaveText("0");
  await expect(page.locator('[data-current="true"] strong')).toHaveText("EXPLORE");
});

test("manual takeover cancels the remaining Replay timers", async ({ page }) => {
  await page.clock.install();
  await page.getByTestId("live-demo-cta").click();
  await page.clock.fastForward(1_000);
  await page.getByRole("button", { name: "Aurora One 가격 확인" }).click();
  await page.clock.fastForward(30_000);
  await page.getByText("Developer View").click();
  await expect(page.getByTestId("event-count")).toHaveText("2");
  await expect(page.getByTestId("replay-status")).toContainText("직접 탐색을 시작해 데모 재생을 멈췄습니다");
});

test("Stop preserves state and cancels the remaining Replay timers", async ({ page }) => {
  await page.clock.install();
  await page.getByTestId("live-demo-cta").click();
  await page.clock.fastForward(7_000);
  await page.getByRole("button", { name: "Stop" }).click();
  await page.clock.fastForward(30_000);
  await page.getByText("Developer View").click();
  await expect(page.getByTestId("event-count")).toHaveText("4");
  await expect(page.locator('[data-current="true"] strong')).toHaveText("COMPARE");
  await expect(page.getByTestId("replay-status")).toContainText("현재 상태에서 데모를 멈췄습니다");
});
