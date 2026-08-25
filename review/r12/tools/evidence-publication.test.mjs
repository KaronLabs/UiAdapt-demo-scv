import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { publishEvidenceDirectory } from "./evidence-publication.mjs";

test("publishes a complete staged directory without mixing prior evidence", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "uiadapt-stage-publish-"));
  t.after(() => rm(root, { force: true, recursive: true }));
  const target = path.join(root, "evidence");
  const staged = path.join(root, "staged");
  await mkdir(target);
  await mkdir(staged);
  await writeFile(path.join(target, "stale-pass.json"), "old");
  await writeFile(path.join(staged, "stage-capture.json"), "new");

  await publishEvidenceDirectory(staged, target);

  assert.equal(await readFile(path.join(target, "stage-capture.json"), "utf8"), "new");
  await assert.rejects(readFile(path.join(target, "stale-pass.json"), "utf8"), { code: "ENOENT" });
});

test("publishes failed-run heatmaps separately without replacing prior PASS evidence", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "uiadapt-stage-failure-"));
  t.after(() => rm(root, { force: true, recursive: true }));
  const target = path.join(root, "evidence");
  const failed = path.join(root, "evidence-failure");
  const staged = path.join(root, "staged");
  await mkdir(target);
  await mkdir(staged);
  await writeFile(path.join(target, "stage-ssim.json"), "pass");
  await writeFile(path.join(staged, "stage-COMPARE-diff.png"), "diagnostic");

  await publishEvidenceDirectory(staged, failed);

  assert.equal(await readFile(path.join(target, "stage-ssim.json"), "utf8"), "pass");
  assert.equal(await readFile(path.join(failed, "stage-COMPARE-diff.png"), "utf8"), "diagnostic");
});
