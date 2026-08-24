import { expect, test } from "@playwright/test";
import {
  contrastAudit,
  EXPECTED_DOMAIN_VALUES,
  EXPECTED_PRODUCTS,
  EXPECTED_STAGE_VALUES,
  jumpToStageState,
  observeStageNetwork,
  openStage,
  screenshotHash,
  STAGE_STATES,
  stylesheetAudit,
  visibleLineAudit,
  visibleTextAudit,
  type StageNetworkEvidence,
  type StageState,
} from "./fixtures/stage-audit";

const EXPECTED_CHROME_VERSION = "145.0.7632.117";
const STAGE_VIEWPORT = { width: 1920, height: 1080 };

type StagePageEvidence = {
  network: StageNetworkEvidence;
  consoleErrors: string[];
};

const evidence = new WeakMap<object, StagePageEvidence>();

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  evidence.set(page, { network: observeStageNetwork(page), consoleErrors });
  await openStage(page);
});

test.afterEach(async ({ page }) => {
  const observed = evidence.get(page);
  expect(observed?.consoleErrors ?? [], "Stage must not emit browser console errors").toEqual([]);
});

test("route and browser: logical /stage mounts under the deployment base in exact Chrome 145", async ({ browser, page }) => {
  expect(browser.version()).toBe(EXPECTED_CHROME_VERSION);
  expect(page.viewportSize()).toEqual(STAGE_VIEWPORT);
  await expect(page).toHaveURL(/\/uiadapt_demo\/stage$/);
  await expect(page.locator("#stage-root")).toBeVisible();
});

test("contract 1: every state is a fixed 1920x1080 frame with zero scroll", async ({ page }) => {
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    const geometry = await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>("#stage-root")!.getBoundingClientRect();
      return {
        root: { x: root.x, y: root.y, width: root.width, height: root.height },
        document: {
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          clientWidth: document.documentElement.clientWidth,
          clientHeight: document.documentElement.clientHeight,
        },
      };
    });
    expect(geometry).toEqual({
      root: { x: 0, y: 0, width: 1920, height: 1080 },
      document: { scrollWidth: 1920, scrollHeight: 1080, clientWidth: 1920, clientHeight: 1080 },
    });
  }
});

test("contract 2: data-state exposes exactly one of the three state views", async ({ page }) => {
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    await expect(page.locator("#stage-root")).toHaveAttribute("data-state", state);
    for (const candidate of STAGE_STATES) {
      const view = page.locator(`[data-stage-state-view="${candidate}"]`);
      if (candidate === state) await expect(view).toBeVisible();
      else await expect(view).toBeHidden();
    }
  }
});

test("contract 3: visible text is at least 24px with a 22px mono exception", async ({ page }) => {
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    expect(await visibleTextAudit(page), `${state} typography violations`).toEqual([]);
  }
});

test("contract 4: visible text contrast is 7:1 below 32px and 4.5:1 at 32px or above", async ({ page }) => {
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    expect(await contrastAudit(page), `${state} contrast violations`).toEqual([]);
  }
});

test("contract 5: the Adaptive OFF panel is pixel-identical in all three states", async ({ page }) => {
  const hashes: string[] = [];
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    hashes.push(await screenshotHash(page, ".stage-panel--off"));
  }
  expect(new Set(hashes).size).toBe(1);
});

test("contract 6: both presentation slots stay exactly 220px high", async ({ page }) => {
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    const heights = await page.locator(".stage-state-slot").evaluateAll((slots) => (
      slots.map((slot) => (slot as HTMLElement).getBoundingClientRect().height)
    ));
    expect(heights).toEqual([220, 220]);
  }
});

test("contract 7: all catalog card widths remain equal in every state", async ({ page }) => {
  const widthsByState: number[][] = [];
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    const widths = await page.locator(".stage-product-card").evaluateAll((cards) => (
      cards.map((card) => (card as HTMLElement).getBoundingClientRect().width)
    ));
    expect(widths).toHaveLength(6);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(0.01);
    widthsByState.push(widths);
  }
  expect(widthsByState[1]).toEqual(widthsByState[0]);
  expect(widthsByState[2]).toEqual(widthsByState[0]);
});

test("contract 8: every visible line is either absent or at least 4px thick", async ({ page }) => {
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    expect(await visibleLineAudit(page), `${state} hairline violations`).toEqual([]);
  }
});

test("contract 9: checkpoint timer, evidence, score, and reconstruction copy are exact", async ({ page }) => {
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    const text = await page.locator("#stage-root").innerText();
    for (const expected of EXPECTED_STAGE_VALUES[state]) expect(text).toContain(expected);
  }
});

test("contract 10: Stage attempts no off-origin or telemetry network request", async ({ page }) => {
  await page.waitForLoadState("networkidle");
  for (const state of STAGE_STATES) await jumpToStageState(page, state);
  const observed = evidence.get(page)!.network;
  expect(observed.externalRequests).toEqual([]);
  expect(observed.telemetryRequests).toEqual([]);
});

test("contract 11: loaded Stage stylesheets contain zero hover selectors", async ({ page }) => {
  expect((await stylesheetAudit(page)).hoverRules).toBe(0);
});

test("contract 12: loaded Stage stylesheets contain zero infinite animations", async ({ page }) => {
  expect((await stylesheetAudit(page)).infiniteAnimations).toBe(0);
});

test("contract 13: prose and mono text use the approved local font families", async ({ page }) => {
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    const fonts = await page.evaluate(() => ({
      body: getComputedStyle(document.querySelector<HTMLElement>("#stage-root")!).fontFamily,
      heading: getComputedStyle(document.querySelector<HTMLElement>("#stage-root h1, #stage-root h2")!).fontFamily,
      mono: getComputedStyle(document.querySelector<HTMLElement>("#stage-root .stage-mono")!).fontFamily,
      wantedLoaded: document.fonts.check('24px "Wanted Sans Variable"'),
      monoLoaded: document.fonts.check('600 22px "IBM Plex Mono"'),
    }));
    expect(fonts.body).toMatch(/Wanted Sans Variable|Pretendard/i);
    expect(fonts.heading).toMatch(/Wanted Sans Variable|Pretendard/i);
    expect(fonts.mono).toContain("IBM Plex Mono");
    expect(fonts.wantedLoaded).toBe(true);
    expect(fonts.monoLoaded).toBe(true);
  }
});

test("controls: play, pause, reset, completion, and fullscreen change observable Stage state", async ({ page }) => {
  const root = page.locator("#stage-root");
  await page.getByRole("button", { name: "▶ 27초 데모" }).click();
  await expect(root).toHaveAttribute("data-playback", "RUNNING");
  await page.clock.fastForward(12_000);
  await expect(root).toHaveAttribute("data-state", "COMPARE");

  await page.getByRole("button", { name: "일시정지" }).click();
  await expect(root).toHaveAttribute("data-playback", "PAUSED");
  const pausedAt = await root.getAttribute("data-elapsed-ms");
  await page.clock.fastForward(3_000);
  await expect(root).toHaveAttribute("data-elapsed-ms", pausedAt ?? "");

  await page.getByRole("button", { name: "처음부터" }).click();
  await expect(root).toHaveAttribute("data-state", "EXPLORE");
  await expect(root).toHaveAttribute("data-elapsed-ms", "0");

  await page.getByRole("button", { name: "전체화면" }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id ?? null)).toBe("stage-root");
  await page.evaluate(() => document.exitFullscreen());

  await page.getByRole("button", { name: "▶ 27초 데모" }).click();
  await page.clock.fastForward(27_000);
  await expect(root).toHaveAttribute("data-playback", "COMPLETED");
  await expect(root).toHaveAttribute("data-elapsed-ms", "27000");
});

test("timing: exact Stage boundary checkpoints expose canonical replay prefixes", async ({ page }) => {
  const root = page.locator("#stage-root");
  const assertAt = async (key: string, elapsedMs: number, state: StageState, sequenceNo: string) => {
    await page.keyboard.press(key);
    await expect(root).toHaveAttribute("data-elapsed-ms", String(elapsedMs));
    await expect(root).toHaveAttribute("data-state", state);
    await expect(root).toHaveAttribute("data-domain-sequence-no", sequenceNo);
  };

  await assertAt("1", 3_000, "EXPLORE", "6");
  await assertAt("2", 12_000, "COMPARE", "23");
  await assertAt("3", 20_000, "PURCHASE_INTENT", "40");
});

test("domain/catalog: checkpoints come from canonical reducer data and preserve every product ID and price", async ({ page }) => {
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    const root = page.locator("#stage-root");
    await expect(root).toHaveAttribute("data-domain-sequence-no", EXPECTED_DOMAIN_VALUES[state].sequenceNo);
    await expect(root).toHaveAttribute("data-domain-window-size", EXPECTED_DOMAIN_VALUES[state].windowSize);
    await expect(root).toHaveAttribute("data-domain-change-score", EXPECTED_DOMAIN_VALUES[state].changeScore);
    const products = await page.locator(".stage-product-card").evaluateAll((cards) => cards.map((card) => ({
      id: (card as HTMLElement).dataset.productId,
      price: (card as HTMLElement).dataset.productPrice,
    })));
    expect(products).toEqual([...EXPECTED_PRODUCTS, ...EXPECTED_PRODUCTS]);
  }
});

test("determinism: the same checkpoint input produces the same rendered frame after reload", async ({ page }) => {
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    const first = await screenshotHash(page, "#stage-root");
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await jumpToStageState(page, state);
    const second = await screenshotHash(page, "#stage-root");
    expect(second, `${state} frame changed for identical replay input`).toBe(first);
  }
});

test("keyboard controls: keys 1, 2, and 3 jump to exact replay checkpoints", async ({ page }) => {
  const expectedElapsed: Record<StageState, string> = {
    EXPLORE: "3000",
    COMPARE: "12000",
    PURCHASE_INTENT: "20000",
  };
  for (const state of STAGE_STATES) {
    await jumpToStageState(page, state);
    await expect(page.locator("#stage-root")).toHaveAttribute("data-elapsed-ms", expectedElapsed[state]);
  }
});
