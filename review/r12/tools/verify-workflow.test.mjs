import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = path.resolve(import.meta.dirname, "../../..");

test("fetches the PR base branch history before a three-dot whitespace comparison", async () => {
  const workflow = await readFile(path.join(ROOT, ".github/workflows/verify.yml"), "utf8");
  const whitespaceStep = workflow.slice(workflow.indexOf("- name: Check diff whitespace"));

  assert.match(whitespaceStep, /BASE_REF: \$\{\{ github\.event\.pull_request\.base\.ref \}\}/);
  assert.match(
    whitespaceStep,
    /git fetch --no-tags origin "\+refs\/heads\/\$BASE_REF:refs\/remotes\/origin\/\$BASE_REF"/,
  );
  assert.ok(
    whitespaceStep.indexOf("git fetch --no-tags origin \"+refs/heads/$BASE_REF")
      < whitespaceStep.indexOf("git diff --check \"$BASE_SHA...$HEAD_SHA\""),
  );
  assert.match(
    whitespaceStep,
    /git diff --check "\$BASE_SHA\.\.\.\$HEAD_SHA"[^\n]* \|\| \{[\s\S]*if git merge-base "\$BASE_SHA" "\$HEAD_SHA" >\/dev\/null; then[\s\S]*exit "\$DIFF_STATUS"[\s\S]*git diff --check "\$BASE_SHA" "\$HEAD_SHA"/,
  );
});
