import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

function referencedAssets(html) {
  return [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map((match) => match[1]);
}

test("Replit build emits a root-hosted dist artifact with real assets", () => {
  execFileSync("npm", ["run", "build:replit"], { cwd: root, stdio: "pipe", shell: process.platform === "win32" });
  const htmlPath = join(dist, "index.html");
  if (!existsSync(htmlPath)) throw new Error("dist/index.html is missing");
  const html = readFileSync(htmlPath, "utf8");
  const assets = referencedAssets(html);
  if (assets.length === 0) throw new Error("dist/index.html has no local assets");
  for (const assetUrl of assets) {
    if (!assetUrl.startsWith("/assets/")) throw new Error("non-root Replit asset URL: " + assetUrl);
    const assetPath = join(dist, assetUrl.slice(1));
    if (!existsSync(assetPath) || !statSync(assetPath).isFile()) throw new Error("missing asset: " + assetUrl);
    const body = readFileSync(assetPath);
    if (body.subarray(0, 15).toString("utf8").toLowerCase().includes("<!doctype")) throw new Error("HTML fallback served as asset: " + assetUrl);
  }
  if (!readdirSync(dist).includes("index.html")) throw new Error("dist directory is not publishable");
});
