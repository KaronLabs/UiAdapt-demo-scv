import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { log } from "node:console";
import { createServer } from "node:http";
import { once } from "node:events";
import process from "node:process";
import { URL } from "node:url";

const cases = [
  {
    command: "build",
    expectedPrefix: "/uiadapt_demo/assets/",
    indexPath: "/uiadapt_demo/",
    expectedIconHref: "/uiadapt_demo/favicon.svg",
  },
  {
    command: "build:pages",
    expectedPrefix: "/assets/",
    indexPath: "/",
    expectedIconHref: "/favicon.svg",
  },
];

async function verifyServedFavicon(testCase, html) {
  const favicon = readFileSync(new URL("../dist/favicon.svg", import.meta.url));
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (pathname === testCase.indexPath) {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(html);
      return;
    }
    if (pathname === testCase.expectedIconHref) {
      response.writeHead(200, { "Content-Type": "image/svg+xml" });
      response.end(favicon);
      return;
    }
    response.writeHead(404);
    response.end();
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("HTTP verifier has no TCP port");
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    const indexResponse = await globalThis.fetch(`${origin}${testCase.indexPath}`);
    if (indexResponse.status !== 200) {
      throw new Error(`${testCase.command} index returned HTTP ${indexResponse.status}`);
    }
    const servedHtml = await indexResponse.text();
    const iconHref = servedHtml.match(/<link[^>]*rel="icon"[^>]*href="([^"]+)"/i)?.[1];
    if (iconHref !== testCase.expectedIconHref) {
      throw new Error(`${testCase.command} emitted favicon href ${iconHref ?? "missing"}`);
    }

    const externalUrls = [...servedHtml.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((url) => /^(?:https?:)?\/\//i.test(url));
    if (externalUrls.length > 0) {
      throw new Error(`${testCase.command} emitted external asset URLs: ${externalUrls.join(", ")}`);
    }

    const iconResponse = await globalThis.fetch(`${origin}${iconHref}`);
    const contentType = iconResponse.headers.get("content-type") ?? "";
    const iconBody = await iconResponse.text();
    if (iconResponse.status !== 200) {
      throw new Error(`${testCase.command} favicon returned HTTP ${iconResponse.status}`);
    }
    if (!contentType.toLowerCase().startsWith("image/svg+xml")) {
      throw new Error(`${testCase.command} favicon returned Content-Type ${contentType || "missing"}`);
    }
    if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(iconBody) || /<html\b/i.test(iconBody)) {
      throw new Error(`${testCase.command} favicon body is not SVG`);
    }
  } finally {
    server.close();
    await once(server, "close");
  }
}

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

  await verifyServedFavicon(testCase, html);

  log(
    `PASS ${testCase.command}: ${assetUrls.length} asset URL(s) use ${testCase.expectedPrefix}; favicon ${testCase.expectedIconHref} served as image/svg+xml`,
  );
}
