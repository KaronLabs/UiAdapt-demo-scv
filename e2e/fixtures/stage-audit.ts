import { createHash } from "node:crypto";
import { expect, type Page } from "@playwright/test";

export const STAGE_STATES = ["EXPLORE", "COMPARE", "PURCHASE_INTENT"] as const;
export type StageState = (typeof STAGE_STATES)[number];

export const EXPECTED_STAGE_VALUES = {
  EXPLORE: ["00:03", "6 / 15", "0.08", "0회"],
  COMPARE: ["00:12", "17 / 15", "0.41", "1회"],
  PURCHASE_INTENT: ["00:20", "20 / 15", "0.67", "2회"],
} as const;

export const EXPECTED_DOMAIN_VALUES = {
  EXPLORE: { sequenceNo: "6", windowSize: "6", changeScore: "0.5" },
  COMPARE: { sequenceNo: "23", windowSize: "20", changeScore: "0.45" },
  PURCHASE_INTENT: { sequenceNo: "40", windowSize: "20", changeScore: "0.7" },
} as const;

export const EXPECTED_PRODUCTS = [
  { id: "aurora-one", price: "329000" },
  { id: "nova-pro", price: "279000" },
  { id: "halo-air", price: "199000" },
] as const;

const STATE_KEYS: Record<StageState, string> = {
  EXPLORE: "1",
  COMPARE: "2",
  PURCHASE_INTENT: "3",
};

export type StageNetworkEvidence = {
  externalRequests: string[];
  telemetryRequests: string[];
};

export function observeStageNetwork(page: Page): StageNetworkEvidence {
  const evidence: StageNetworkEvidence = { externalRequests: [], telemetryRequests: [] };
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:8766") evidence.externalRequests.push(request.url());
    if (url.pathname.startsWith("/api/uiadapt/")) evidence.telemetryRequests.push(request.url());
  });
  return evidence;
}

export async function openStage(page: Page) {
  await page.goto("/uiadapt_demo/stage/");
  const root = page.locator("#stage-root");
  await expect(root, "the /stage route must mount the real Stage application").toHaveCount(1, { timeout: 1_000 });
  await page.evaluate(() => document.fonts.ready);
  return root;
}

export async function jumpToStageState(page: Page, state: StageState) {
  await page.keyboard.press(STATE_KEYS[state]);
  await expect(page.locator("#stage-root")).toHaveAttribute("data-state", state);
  await expect(page.locator(`[data-stage-state-view="${state}"]`)).toBeVisible();
}

export async function visibleTextAudit(page: Page) {
  return page.evaluate(() => {
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width >= 1 && rect.height >= 1 && style.display !== "none" && style.visibility !== "hidden";
    };
    const selector = (element: HTMLElement) => {
      const id = element.id ? `#${element.id}` : "";
      const classes = Array.from(element.classList).map((name) => `.${name}`).join("");
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const issues: string[] = [];
    const walker = document.createTreeWalker(document.querySelector("#stage-root")!, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue?.trim()) continue;
      const element = node.parentElement;
      if (!element || element.closest("svg") || !visible(element)) continue;
      const style = getComputedStyle(element);
      const size = Number.parseFloat(style.fontSize);
      const mono = /IBM Plex Mono|mono|Consolas|Courier/i.test(style.fontFamily);
      if (size < 24 && !(mono && size >= 22)) {
        issues.push(`${selector(element)} ${size}px: ${node.nodeValue.trim().slice(0, 32)}`);
      }
    }
    return issues;
  });
}

export async function contrastAudit(page: Page) {
  return page.evaluate(() => {
    type Color = [number, number, number, number];
    const parseColor = (value: string): Color | null => {
      const channels = value.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3) return null;
      return [channels[0], channels[1], channels[2], channels[3] ?? 1];
    };
    const mix = (foreground: Color, background: Color): Color => {
      const alpha = foreground[3];
      return [
        alpha * foreground[0] + (1 - alpha) * background[0],
        alpha * foreground[1] + (1 - alpha) * background[1],
        alpha * foreground[2] + (1 - alpha) * background[2],
        1,
      ];
    };
    const effectiveBackground = (element: HTMLElement) => {
      const layers: Color[] = [];
      for (let current: HTMLElement | null = element; current; current = current.parentElement) {
        const color = parseColor(getComputedStyle(current).backgroundColor);
        if (color && color[3] > 0) {
          layers.push(color);
          if (color[3] >= 1) break;
        }
      }
      let background: Color = [11, 27, 51, 1];
      for (let index = layers.length - 1; index >= 0; index -= 1) {
        background = mix(layers[index], background);
      }
      return background;
    };
    const channel = (value: number) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (color: Color) => (
      0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2])
    );
    const ratio = (first: Color, second: Color) => {
      const light = Math.max(luminance(first), luminance(second));
      const dark = Math.min(luminance(first), luminance(second));
      return (light + 0.05) / (dark + 0.05);
    };
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width >= 1 && rect.height >= 1 && style.display !== "none" && style.visibility !== "hidden";
    };
    const issues: string[] = [];
    const walker = document.createTreeWalker(document.querySelector("#stage-root")!, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue?.trim()) continue;
      const element = node.parentElement;
      if (!element || element.closest("svg") || !visible(element)) continue;
      const style = getComputedStyle(element);
      const background = effectiveBackground(element);
      const parsedForeground = parseColor(style.color);
      if (!parsedForeground) continue;
      const foreground = parsedForeground[3] < 1 ? mix(parsedForeground, background) : parsedForeground;
      const fontSize = Number.parseFloat(style.fontSize);
      const required = fontSize >= 32 ? 4.5 : 7;
      const measured = ratio(foreground, background);
      if (measured < required) {
        issues.push(`${element.tagName.toLowerCase()} ${measured.toFixed(2)}<${required}: ${node.nodeValue.trim().slice(0, 32)}`);
      }
    }
    return issues;
  });
}

export async function visibleLineAudit(page: Page) {
  return page.evaluate(() => {
    const issues: string[] = [];
    const parseAlpha = (value: string) => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return channels.length >= 4 ? channels[3] : channels.length >= 3 ? 1 : 0;
    };
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width >= 1 && rect.height >= 1 && style.display !== "none" && style.visibility !== "hidden";
    };
    document.querySelectorAll<HTMLElement>("#stage-root *").forEach((element) => {
      if (element.closest("svg") || !visible(element)) return;
      const style = getComputedStyle(element);
      for (const side of ["Top", "Right", "Bottom", "Left"]) {
        const width = Number.parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`));
        const color = style.getPropertyValue(`border-${side.toLowerCase()}-color`);
        if (width > 0 && width < 4 && parseAlpha(color) > 0) {
          issues.push(`${element.tagName.toLowerCase()} border-${side.toLowerCase()} ${width}px`);
        }
      }
      const backgroundAlpha = parseAlpha(style.backgroundColor);
      const rect = element.getBoundingClientRect();
      if (backgroundAlpha > 0 && (
        (rect.height >= 1 && rect.height <= 3 && rect.width > 40)
        || (rect.width >= 1 && rect.width <= 3 && rect.height > 40)
      )) {
        issues.push(`${element.tagName.toLowerCase()} strip ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    });
    document.querySelectorAll<SVGGraphicsElement>("#stage-root svg *").forEach((element) => {
      const style = getComputedStyle(element);
      const strokeWidth = Number.parseFloat(style.strokeWidth);
      const strokeAlpha = Number.parseFloat(style.strokeOpacity) * Number.parseFloat(style.opacity);
      if (style.stroke === "none" || !(strokeWidth > 0) || !(strokeAlpha > 0) || !visible(element as unknown as HTMLElement)) {
        return;
      }
      const matrix = element.getScreenCTM();
      if (!matrix) return;
      const scaleX = Math.hypot(matrix.a, matrix.b);
      const scaleY = Math.hypot(matrix.c, matrix.d);
      const renderedWidth = style.vectorEffect === "non-scaling-stroke"
        ? strokeWidth
        : strokeWidth * Math.min(scaleX, scaleY);
      if (renderedWidth < 4) {
        issues.push(`${element.tagName.toLowerCase()} stroke ${renderedWidth.toFixed(4)}px`);
      }
    });
    return issues;
  });
}

export async function stylesheetAudit(page: Page) {
  return page.evaluate(() => {
    let hoverRules = 0;
    let infiniteAnimations = 0;
    const walk = (rules: CSSRuleList) => {
      Array.from(rules).forEach((rule) => {
        if (rule instanceof CSSStyleRule) {
          if (rule.selectorText.includes(":hover")) hoverRules += 1;
          const animation = `${rule.style.animation} ${rule.style.animationIterationCount}`;
          if (/infinite/i.test(animation)) infiniteAnimations += 1;
        }
        if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
      });
    };
    Array.from(document.styleSheets).forEach((sheet) => walk(sheet.cssRules));
    return { hoverRules, infiniteAnimations };
  });
}

export async function screenshotHash(page: Page, selector: string) {
  const bytes = await page.locator(selector).screenshot({ animations: "disabled" });
  return createHash("sha256").update(bytes).digest("hex");
}
