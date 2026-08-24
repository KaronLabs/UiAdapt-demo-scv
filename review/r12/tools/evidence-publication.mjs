import { randomUUID } from "node:crypto";
import { rename, rm } from "node:fs/promises";

export async function publishEvidenceDirectory(stagedDirectory, targetDirectory) {
  const backupDirectory = `${targetDirectory}.previous-${randomUUID()}`;
  let previousMoved = false;
  try {
    await rename(targetDirectory, backupDirectory);
    previousMoved = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  try {
    await rename(stagedDirectory, targetDirectory);
  } catch (error) {
    if (previousMoved) await rename(backupDirectory, targetDirectory);
    throw error;
  }

  if (previousMoved) await rm(backupDirectory, { force: true, recursive: true });
}
