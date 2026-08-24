import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { publishEvidenceDirectory } from "./evidence-publication.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REVIEW_DIR = path.join(ROOT, "review/r12");
const TARGET_DIR = path.join(REVIEW_DIR, "evidence");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit", ...options });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code=${code} signal=${signal ?? "none"}`));
    });
  });
}

async function main() {
  const runDirectory = await mkdtemp(path.join(REVIEW_DIR, ".stage-evidence-"));
  const stagedDirectory = path.join(runDirectory, "evidence");
  await mkdir(stagedDirectory);
  try {
    await run(process.execPath, ["review/r12/tools/capture-stage-evidence.mjs"], {
      env: { ...process.env, UIADAPT_STAGE_EVIDENCE_DIR: stagedDirectory },
    });
    await run(process.execPath, [
      "review/r12/tools/measure-stage-ssim.mjs",
      "--actual-dir", stagedDirectory,
      "--output-dir", stagedDirectory,
      "--report-actual-dir", TARGET_DIR,
    ]);
    await publishEvidenceDirectory(stagedDirectory, TARGET_DIR);
  } finally {
    await rm(runDirectory, { force: true, recursive: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
