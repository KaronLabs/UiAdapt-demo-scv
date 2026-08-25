import { copyFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const defaultDistRoot = resolve(import.meta.dirname, "../dist");

export async function createStageEntry({ distRoot = defaultDistRoot } = {}) {
  const root = resolve(distRoot);
  const stageDirectory = join(root, "stage");
  const stageEntry = join(stageDirectory, "index.html");
  await mkdir(stageDirectory, { recursive: true });
  await copyFile(join(root, "index.html"), stageEntry);
  return stageEntry;
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPath && pathToFileURL(entryPath).href === import.meta.url) {
  await createStageEntry();
}
