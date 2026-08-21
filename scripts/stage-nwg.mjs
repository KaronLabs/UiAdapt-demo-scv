import { randomUUID } from "node:crypto";
import { cp, mkdir, rename, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const projectRoot = resolve(import.meta.dirname, "..");
const defaultSourceRoot = join(projectRoot, "dist");
const defaultWwwRoot = join(projectRoot, "www");

export async function stageNwg({
  copy = cp,
  sourceRoot = defaultSourceRoot,
  wwwRoot = defaultWwwRoot,
} = {}) {
  const source = resolve(sourceRoot);
  const root = resolve(wwwRoot);
  const sourceStatus = await stat(source);
  if (!sourceStatus.isDirectory()) {
    throw new Error(`NWG stage source must be a directory: ${source}`);
  }

  await mkdir(root, { recursive: true });
  const suffix = `${process.pid}-${randomUUID()}`;
  const target = join(root, "uiadapt_demo");
  const stagedTarget = join(root, `.uiadapt_demo.stage-${suffix}`);
  const backupTarget = join(root, `.uiadapt_demo.backup-${suffix}`);

  try {
    await copy(source, stagedTarget, { recursive: true });

    let hasBackup = false;
    try {
      await rename(target, backupTarget);
      hasBackup = true;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }

    try {
      await rename(stagedTarget, target);
    } catch (error) {
      if (hasBackup) await rename(backupTarget, target);
      throw error;
    }

    if (hasBackup) await rm(backupTarget, { force: true, recursive: true });
  } finally {
    await rm(stagedTarget, { force: true, recursive: true });
  }
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPath && pathToFileURL(entryPath).href === import.meta.url) {
  await stageNwg({ wwwRoot: process.argv[2] ?? defaultWwwRoot });
}
