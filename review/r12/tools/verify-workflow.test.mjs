import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = path.resolve(import.meta.dirname, "../../..");

test("fetches the exact PR base before a three-dot whitespace comparison", async () => {
  const workflow = await readFile(path.join(ROOT, ".github/workflows/verify.yml"), "utf8");
  const whitespaceStep = workflow.slice(workflow.indexOf("- name: Check diff whitespace"));

  assert.match(whitespaceStep, /git fetch --no-tags origin "\$BASE_SHA"/);
  assert.ok(
    whitespaceStep.indexOf("git fetch --no-tags origin \"$BASE_SHA\"")
      < whitespaceStep.indexOf("git diff --check \"$BASE_SHA...$HEAD_SHA\""),
  );
});
