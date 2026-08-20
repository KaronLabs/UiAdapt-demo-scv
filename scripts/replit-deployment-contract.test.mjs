import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

function htmlReferences(html) {
  return [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
}

function cssReferences(css) {
  return [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map((match) => match[1]);
}

function assertPublishableAsset(reference, source) {
  if (!reference.startsWith("/assets/")) {
    throw new Error(`non-root Replit asset URL in ${source}: ${reference}`);
  }
  const assetPath = join(dist, reference.slice(1));
  if (!existsSync(assetPath) || !statSync(assetPath).isFile()) throw new Error(`missing asset: ${reference}`);
  const body = readFileSync(assetPath);
  if (body.subarray(0, 15).toString("utf8").toLowerCase().includes("<!doctype")) {
    throw new Error(`HTML fallback served as asset: ${reference}`);
  }
  return assetPath;
}

test("Replit build emits a root-hosted dist artifact with real assets", () => {
  execFileSync("npm", ["run", "build:replit"], { cwd: root, stdio: "pipe", shell: process.platform === "win32" });
  const htmlPath = join(dist, "index.html");
  if (!existsSync(htmlPath)) throw new Error("dist/index.html is missing");
  const html = readFileSync(htmlPath, "utf8");
  const assets = htmlReferences(html);
  if (assets.length === 0) throw new Error("dist/index.html has no local assets");
  for (const assetUrl of assets) {
    const assetPath = assertPublishableAsset(assetUrl, "index.html");
    if (assetPath.endsWith(".css")) {
      for (const cssUrl of cssReferences(readFileSync(assetPath, "utf8"))) {
        if (cssUrl.startsWith("data:")) continue;
        assertPublishableAsset(cssUrl, assetUrl);
      }
    }
  }
  if (!readdirSync(dist).includes("index.html")) throw new Error("dist directory is not publishable");
});

test("artifact reference inventory includes relative HTML and CSS assets", () => {
  const html = '<script src="assets/app.js"></script><link rel="stylesheet" href="/assets/app.css">';
  const css = '@font-face{src:url(./font.woff2)}';
  if (htmlReferences(html).join(",") !== "assets/app.js,/assets/app.css") {
    throw new Error("HTML references were omitted");
  }
  if (cssReferences(css).join(",") !== "./font.woff2") {
    throw new Error("CSS references were omitted");
  }
});
