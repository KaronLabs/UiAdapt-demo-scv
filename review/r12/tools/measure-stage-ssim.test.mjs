import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";

const ROOT = path.resolve(import.meta.dirname, "../../..");

function runMeasure(outputDirectory) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      "review/r12/tools/measure-stage-ssim.mjs",
      "--actual-dir", "review/r12/evidence",
      "--output-dir", outputDirectory,
      "--threshold", "1.0",
    ], { cwd: ROOT, stdio: "ignore" });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code));
  });
}

test("writes portable evidence paths that remain true after directory publication", async (t) => {
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "uiadapt-stage-report-"));
  t.after(() => rm(outputDirectory, { force: true, recursive: true }));

  assert.equal(await runMeasure(outputDirectory), 1);

  const report = JSON.parse(await readFile(path.join(outputDirectory, "stage-ssim.json"), "utf8"));
  assert.equal(report.states.EXPLORE.actual, "stage-EXPLORE.png");
  assert.deepEqual(report.heatmaps, [
    "stage-EXPLORE-diff.png",
    "stage-COMPARE-diff.png",
    "stage-PURCHASE_INTENT-diff.png",
  ]);
});

test("committed capture report uses portable paths within its evidence directory", async () => {
  const report = JSON.parse(
    await readFile(path.join(ROOT, "review/r12/evidence/stage-capture.json"), "utf8"),
  );

  assert.deepEqual(report.screenshots, [
    "stage-EXPLORE.png",
    "stage-COMPARE.png",
    "stage-PURCHASE_INTENT.png",
  ]);
  assert.equal(report.video, "stage-27s.webm");
});
