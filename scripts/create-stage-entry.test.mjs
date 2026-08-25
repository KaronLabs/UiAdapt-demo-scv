import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { createStageEntry } from "./create-stage-entry.mjs";

test("creates a physical Stage entry from the built application shell", async (t) => {
  const distRoot = await mkdtemp(join(tmpdir(), "uiadapt-stage-entry-"));
  t.after(() => rm(distRoot, { recursive: true, force: true }));
  const shell = "<!doctype html><div id=\"root\"></div>";
  await writeFile(join(distRoot, "index.html"), shell, "utf8");

  const stageEntry = await createStageEntry({ distRoot });

  assert.equal(stageEntry, join(distRoot, "stage", "index.html"));
  assert.equal(await readFile(stageEntry, "utf8"), shell);
});
