import { cp, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";

const projectRoot = resolve(import.meta.dirname, "..");
const source = join(projectRoot, "dist");
const wwwRoot = resolve(process.argv[2] ?? join(projectRoot, "www"));
const target = join(wwwRoot, "uiadapt_demo");

await mkdir(wwwRoot, { recursive: true });
await rm(target, { force: true, recursive: true });
await cp(source, target, { recursive: true });
