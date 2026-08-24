import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { publishEvidenceDirectory } from "./evidence-publication.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REVIEW_DIR = path.join(ROOT, "review/r12");
const TARGET_DIR = path.join(REVIEW_DIR, "evidence");
const FAILURE_DIR = path.resolve(
  process.env.UIADAPT_STAGE_FAILURE_DIR ?? path.join(REVIEW_DIR, "evidence-failure"),
);
const SSIM_THRESHOLD = process.env.UIADAPT_STAGE_SSIM_THRESHOLD ?? "0.85";

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
      "--threshold", SSIM_THRESHOLD,
    ]);
    await publishEvidenceDirectory(stagedDirectory, TARGET_DIR);
    await rm(FAILURE_DIR, { force: true, recursive: true });
  } catch (error) {
    try {
      await access(stagedDirectory);
      await publishEvidenceDirectory(stagedDirectory, FAILURE_DIR);
    } catch (diagnosticError) {
      if (diagnosticError.code !== "ENOENT") {
        if (error instanceof Error && error.cause === undefined) error.cause = diagnosticError;
      }
    }
    throw error;
  } finally {
    await rm(runDirectory, { force: true, recursive: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
