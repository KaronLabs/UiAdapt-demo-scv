import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type EvidencePage = Page & { __consoleErrors?: string[]; __externalRequests?: string[] };

async function pseudoStyle(page: Page, selector: string, pseudo: string, property: string) {
  return page.locator(selector).first().evaluate(
    (element, args) => getComputedStyle(element, args.pseudo).getPropertyValue(args.property),
    { pseudo, property },
  );
}

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("request", (request) => { if (!new URL(request.url()).hostname.startsWith("127.0.0.1")) externalRequests.push(request.url()); });
  (page as EvidencePage).__consoleErrors = consoleErrors;
  (page as EvidencePage).__externalRequests = externalRequests;
  await page.route("**/api/uiadapt/**", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }),
  }));
  await page.goto("/uiadapt_demo/");
  await expect(page.getByRole("heading", { name: "같은 상품을, 더 나은 판단으로." })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect((page as EvidencePage).__consoleErrors ?? []).toEqual([]);
  expect((page as EvidencePage).__externalRequests ?? []).toEqual([]);
});

test("header carries the R11 release label", async ({ page }) => {
  await expect(page.locator(".site-header .brand__lockup small")).toHaveText("Adaptive UI Infrastructure · R11");
});

test("app root mirrors replay status for the visual layer", async ({ page }) => {
  await expect(page.locator(".app")).toHaveAttribute("data-replay", "IDLE");
  await page.getByTestId("live-demo-cta").click();
  await expect(page.locator(".app")).toHaveAttribute("data-replay", "RUNNING");
});

test("console draws the 27s progress line while running and pauses with the replay", async ({ page }) => {
  expect(await pseudoStyle(page, ".hero__console", "::after", "animation-name")).toBe("none");
  await page.getByTestId("live-demo-cta").click();
  await expect.poll(() => pseudoStyle(page, ".hero__console", "::after", "animation-name")).toBe("replay-progress");
  expect(await pseudoStyle(page, ".hero__console", "::after", "animation-duration")).toBe("27s");
  expect(await pseudoStyle(page, ".hero__console", "::after", "animation-play-state")).toBe("running");
  await page.getByRole("button", { name: "Pause" }).click();
  await expect.poll(() => pseudoStyle(page, ".hero__console", "::after", "animation-play-state")).toBe("paused");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect.poll(() => pseudoStyle(page, ".hero__console", "::after", "animation-name")).toBe("none");
});

test("causal arrows pulse only while the replay runs", async ({ page }) => {
  const arrow = page.locator(".causal-trace b").first();
  await expect(arrow).toHaveCSS("animation-name", "none");
  await page.getByTestId("live-demo-cta").click();
  await expect(arrow).toHaveCSS("animation-name", "beam-pulse");
  await expect(page.locator(".causal-trace b").nth(2)).toHaveCSS("animation-delay", "1.2s");
});

test("storefront light sweep is keyed to the applied state", async ({ page }) => {
  expect(await pseudoStyle(page, ".product-grid", "::after", "animation-name")).toBe("none");
  await page.getByTestId("live-demo-cta").click();
  await expect(page.locator(".product-grid")).toHaveAttribute("data-state", "COMPARE", { timeout: 20_000 });
  expect(await pseudoStyle(page, ".product-grid", "::after", "animation-name")).toBe("sweep-compare");
  await expect(page.locator(".product-grid")).toHaveAttribute("data-state", "PURCHASE_INTENT", { timeout: 20_000 });
  expect(await pseudoStyle(page, ".product-grid", "::after", "animation-name")).toBe("sweep-intent");
  expect(await pseudoStyle(page, ".product-card--focused", "::before", "animation-name")).toBe("ring-spin");
});

test("cards enter with a stagger and keep equal geometry at rest", async ({ page }) => {
  const cards = page.locator(".product-card");
  await expect(cards.nth(0)).toHaveCSS("animation-name", "card-in");
  await expect(cards.nth(2)).toHaveCSS("animation-delay", "0.18s");
  await page.waitForTimeout(900);
  const widths = await cards.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("fine pointer gets a tilting console that returns to rest", async ({ page }) => {
  const consoleBox = page.locator(".hero__console");
  await expect(consoleBox.locator(".js-tilt-glare")).toHaveCount(1);
  const rest = await consoleBox.boundingBox();
  const box = rest!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await page.waitForTimeout(300);
  await expect.poll(() => consoleBox.evaluate((node) => getComputedStyle(node).transform)).not.toBe("none");
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1200);
  const after = await consoleBox.boundingBox();
  expect(Math.abs(after!.x - box.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(after!.width - box.width)).toBeLessThanOrEqual(1);
});

test("reduced motion disables tilt and the progress line", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.getByRole("heading", { name: "같은 상품을, 더 나은 판단으로." })).toBeVisible();
  await expect(page.locator(".hero__console .js-tilt-glare")).toHaveCount(0);
  await page.getByTestId("live-demo-cta").click();
  await expect(page.locator(".app")).toHaveAttribute("data-replay", "RUNNING");
  expect(await pseudoStyle(page, ".hero__console", "::after", "animation-name")).toBe("none");
  await expect(page.locator(".product-card").first()).toHaveCSS("animation-duration", "0s");
});

test("full replay keeps the page free of horizontal overflow", async ({ page }) => {
  test.slow();
  await page.getByTestId("live-demo-cta").click();
  await expect(page.locator(".app")).toHaveAttribute("data-replay", "COMPLETED", { timeout: 40_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
