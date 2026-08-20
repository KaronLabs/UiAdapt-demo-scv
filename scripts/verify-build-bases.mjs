import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { log } from "node:console";
import process from "node:process";
import { URL } from "node:url";

const cases = [
  { command: "build", expectedPrefix: "/uiadapt_demo/assets/" },
  { command: "build:pages", expectedPrefix: "/assets/" },
];

for (const testCase of cases) {
  const result = spawnSync(`npm run ${testCase.command}`, {
    encoding: "utf8",
    shell: true,
    stdio: "pipe",
  });

  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");

  if (result.status !== 0) {
    throw new Error(`npm run ${testCase.command} failed with exit code ${result.status}`);
  }

  const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
  const assetUrls = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map(
    (match) => match[1],
  );

  if (assetUrls.length === 0) {
    throw new Error(`npm run ${testCase.command} emitted no asset URLs in dist/index.html`);
  }

  const invalidUrls = assetUrls.filter((url) => !url.startsWith(testCase.expectedPrefix));
  if (invalidUrls.length > 0) {
    throw new Error(
      `npm run ${testCase.command} emitted unexpected asset URLs: ${invalidUrls.join(", ")}`,
    );
  }

  log(
    `PASS ${testCase.command}: ${assetUrls.length} asset URL(s) use ${testCase.expectedPrefix}`,
  );
}
