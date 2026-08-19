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
};

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = [];
  const externalRequests: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  page.on("requestfailed", (request) => failedRequests.push(request.url()));
  const evidencePage = page as EvidencePage;
  evidencePage.__consoleErrors = consoleErrors;
  evidencePage.__externalRequests = externalRequests;
  evidencePage.__failedRequests = failedRequests;
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "같은 상품, 달라지는 무대." })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  const evidencePage = page as EvidencePage;
  expect(evidencePage.__consoleErrors ?? []).toEqual([]);
  expect(evidencePage.__externalRequests ?? []).toEqual([]);
  expect(evidencePage.__failedRequests ?? []).toEqual([]);
});

test("storefront is responsive, local-only, and diagnostics are collapsed", async ({ page }, testInfo) => {
  await settleVisualEvidence(page);
  await expect(page.getByText("Developer View")).toBeVisible();
  await expect(page.locator(".developer-view")).not.toHaveAttribute("open", "");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-explore.png`, fullPage: true, animations: "disabled" });
});

test("the canonical replay changes presentation without changing product data", async ({ page }, testInfo) => {
  await page.clock.install();
  await settleVisualEvidence(page);
  const initialPrices = await page.locator(".product-card__price").allTextContents();
  expect(initialPrices.map((value) => value.trim())).toEqual(expectedPrices);
  expect(await productContracts(page)).toEqual(expectedProducts);
  await page.getByRole("button", { name: /Watch UIAdapt/i }).click();
  await page.clock.fastForward(7_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("COMPARE");
  await expect(page.locator(".product-grid")).toHaveAttribute("data-state", "COMPARE");
  expect(await productContracts(page)).toEqual(expectedProducts);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-compare.png`, fullPage: true, animations: "disabled" });
  await page.clock.fastForward(14_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("FOCUS");
  await expect(page.locator(".product-grid")).toHaveAttribute("data-state", "FOCUS");
  expect((await page.locator(".product-card__price").allTextContents()).map((value) => value.trim())).toEqual(expectedPrices);
  expect(await productContracts(page)).toEqual(expectedProducts);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-focus.png`, fullPage: true, animations: "disabled" });
});

test("Adaptive OFF keeps the same detected state but baseline presentation", async ({ page }) => {
  await page.clock.install();
  await page.getByRole("checkbox", { name: /Adaptive UI/i }).uncheck();
  await page.getByRole("button", { name: /Watch UIAdapt/i }).click();
  await page.clock.fastForward(21_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("FOCUS");
  await expect(page.locator(".product-grid")).toHaveAttribute("data-state", "EXPLORE");
  expect(await productContracts(page)).toEqual(expectedProducts);
});

test("active product control survives the comparison transition", async ({ page }) => {
  await page.clock.install();
  await page.getByRole("button", { name: /Watch UIAdapt/i }).click();
  const price = page.getByRole("button", { name: "Aurora One 가격 확인" });
  await price.focus();
  await expect(price).toBeFocused();
  await page.clock.fastForward(7_000);
  await expect(page.locator('[data-current="true"] strong')).toHaveText("COMPARE");
  await expect(price).toBeFocused();
});

test("keyboard-only path starts, pauses, resets, and records a product action", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (let index = 0; index < 4; index += 1) await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /Watch UIAdapt/i })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("replay-status")).toContainText("동일한 행동 시퀀스");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Pause" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("replay-status")).toContainText("일시 정지");
  await expect(page.locator(".product-card").first()).toHaveCSS("transition-duration", "0s");

  await page.goto("/");
  for (let index = 0; index < 4; index += 1) await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  for (let index = 0; index < 3; index += 1) await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Reset" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("replay-status")).toContainText("직접 둘러보거나");

  await page.goto("/");
  for (let index = 0; index < 6; index += 1) await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Aurora One 가격 확인" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("event-count")).toHaveText("1");
});

test("Pause and Resume preserve virtual progress", async ({ page }) => {
  await page.clock.install();
  await page.getByRole("button", { name: /Watch UIAdapt/i }).click();
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
  await page.getByRole("button", { name: /Watch UIAdapt/i }).click();
  await page.clock.fastForward(3_000);
  await page.getByRole("button", { name: "Reset" }).click();
  await page.clock.fastForward(30_000);
  await page.getByText("Developer View").click();
  await expect(page.getByTestId("event-count")).toHaveText("0");
  await expect(page.locator('[data-current="true"] strong')).toHaveText("EXPLORE");
});

test("manual takeover cancels the remaining Replay timers", async ({ page }) => {
  await page.clock.install();
  await page.getByRole("button", { name: /Watch UIAdapt/i }).click();
  await page.clock.fastForward(1_000);
  await page.getByRole("button", { name: "Aurora One 가격 확인" }).click();
  await page.clock.fastForward(30_000);
  await page.getByText("Developer View").click();
  await expect(page.getByTestId("event-count")).toHaveText("2");
  await expect(page.getByTestId("replay-status")).toContainText("직접 탐색을 시작해 데모 재생을 멈췄습니다");
});

test("Stop preserves state and cancels the remaining Replay timers", async ({ page }) => {
  await page.clock.install();
  await page.getByRole("button", { name: /Watch UIAdapt/i }).click();
  await page.clock.fastForward(7_000);
  await page.getByRole("button", { name: "Stop" }).click();
  await page.clock.fastForward(30_000);
  await page.getByText("Developer View").click();
  await expect(page.getByTestId("event-count")).toHaveText("4");
  await expect(page.locator('[data-current="true"] strong')).toHaveText("COMPARE");
  await expect(page.getByTestId("replay-status")).toContainText("현재 상태에서 데모를 멈췄습니다");
});
