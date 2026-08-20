import { chromium } from "@playwright/test";

const publicUrl = process.env.REPLIT_PUBLIC_URL;

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

if (!publicUrl) {
  fail("REPLIT_PUBLIC_URL is required");
} else {
  let target;
  try {
    target = new URL(publicUrl);
  } catch {
    fail("REPLIT_PUBLIC_URL must be a valid HTTPS URL");
  }

  if (target && target.protocol !== "https:") {
    fail("REPLIT_PUBLIC_URL must use HTTPS");
  }

  if (target && process.exitCode !== 1) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    const failedRequests = [];
    const externalRequests = [];
    const localResponses = [];
    const states = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== target.origin) externalRequests.push(request.url());
    });
    page.on("requestfailed", (request) => failedRequests.push(request.url()));
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.origin !== target.origin) return;
      const resourceType = response.request().resourceType();
      localResponses.push({
        url: response.url(),
        status: response.status(),
        resourceType,
        contentType: response.headers()["content-type"] ?? "",
      });
    });

    try {
      const documentResponse = await page.goto(target.href, { waitUntil: "networkidle" });
      if (!documentResponse || documentResponse.status() >= 400) {
        throw new Error(`document request failed with status ${documentResponse?.status() ?? "none"}`);
      }
      await page.evaluate(() => document.fonts.ready);
      const watch = page.getByRole("button", { name: /Watch UIAdapt/i });
      if ((await watch.count()) !== 1) throw new Error("Watch UIAdapt control is missing");

      await page.clock.install();
      await watch.click();
      await page.clock.fastForward(7_000);
      await page.waitForFunction(() => document.querySelector('[data-current="true"] strong')?.textContent === "COMPARE");
      states.push("COMPARE");
      await page.clock.fastForward(14_000);
      await page.waitForFunction(() => document.querySelector('[data-current="true"] strong')?.textContent === "FOCUS");
      states.push("FOCUS");

      const badResponses = localResponses.filter(({ status }) => status >= 400);
      const htmlAssets = localResponses.filter(({ resourceType, contentType }) =>
        ["script", "stylesheet", "font"].includes(resourceType) && contentType.toLowerCase().includes("text/html"),
      );
      if (badResponses.length > 0) throw new Error(`${badResponses.length} local response(s) returned HTTP >= 400`);
      if (htmlAssets.length > 0) throw new Error(`${htmlAssets.length} asset response(s) returned HTML`);
      if (failedRequests.length > 0) throw new Error(`${failedRequests.length} request(s) failed`);
      if (consoleErrors.length > 0) throw new Error(`${consoleErrors.length} console error(s) occurred`);
      if (externalRequests.length > 0) throw new Error(`${externalRequests.length} unexpected external request(s) occurred`);

      console.log(`URL: ${target.href}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`Local responses: ${localResponses.length}`);
      console.log(`Failed requests: ${failedRequests.length}`);
      console.log(`Console errors: ${consoleErrors.length}`);
      console.log(`External requests: ${externalRequests.length}`);
      console.log(`States observed: ${states.join(" -> ")}`);
      console.log("PASS: Replit public smoke contract satisfied");
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    } finally {
      await browser.close();
    }
  }
}
