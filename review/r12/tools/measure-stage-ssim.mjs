import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { PNG } from "pngjs";
import { ssim } from "ssim.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const STATES = Object.freeze(["EXPLORE", "COMPARE", "PURCHASE_INTENT"]);
const EXPECTED_SIZE = Object.freeze({ width: 1920, height: 1080 });

function parseArguments(argv) {
  const options = {
    actualDir: path.join(ROOT, "review/r12/evidence"),
    baselineDir: path.join(ROOT, "review/r12/baseline"),
    outputDir: path.join(ROOT, "review/r12/evidence"),
    threshold: 0.85,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") {
      options.json = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}`);
    if (argument === "--actual-dir") options.actualDir = path.resolve(value);
    else if (argument === "--baseline-dir") options.baselineDir = path.resolve(value);
    else if (argument === "--output-dir") options.outputDir = path.resolve(value);
    else if (argument === "--threshold") options.threshold = Number(value);
    else throw new Error(`Unknown argument: ${argument}`);
    index += 1;
  }

  if (!Number.isFinite(options.threshold) || options.threshold < 0 || options.threshold > 1) {
    throw new Error(`Threshold must be between 0 and 1: ${options.threshold}`);
  }
  return options;
}

async function loadPng(filePath, label) {
  let png;
  try {
    png = PNG.sync.read(await readFile(filePath));
  } catch (error) {
    throw new Error(`${label} is not a readable PNG: ${filePath}`, { cause: error });
  }
  if (png.width !== EXPECTED_SIZE.width || png.height !== EXPECTED_SIZE.height) {
    throw new Error(
      `${label} must be ${EXPECTED_SIZE.width}x${EXPECTED_SIZE.height}, got ${png.width}x${png.height}: ${filePath}`,
    );
  }
  return png;
}

function createHeatmap(baseline, actual) {
  const heatmap = new PNG({ width: baseline.width, height: baseline.height });
  for (let offset = 0; offset < baseline.data.length; offset += 4) {
    const difference = Math.max(
      Math.abs(baseline.data[offset] - actual.data[offset]),
      Math.abs(baseline.data[offset + 1] - actual.data[offset + 1]),
      Math.abs(baseline.data[offset + 2] - actual.data[offset + 2]),
    );
    const intensity = Math.min(255, difference * 4);
    heatmap.data[offset] = intensity;
    heatmap.data[offset + 1] = Math.max(0, intensity - 96);
    heatmap.data[offset + 2] = 0;
    heatmap.data[offset + 3] = 255;
  }
  return PNG.sync.write(heatmap);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const comparisons = [];

  for (const state of STATES) {
    const baselinePath = path.join(options.baselineDir, `stage-${state}.png`);
    const actualPath = path.join(options.actualDir, `stage-${state}.png`);
    const baseline = await loadPng(baselinePath, `${state} baseline`);
    const actual = await loadPng(actualPath, `${state} actual`);
    const result = ssim(baseline, actual, { ssim: "weber" });
    comparisons.push({
      state,
      baselinePath,
      actualPath,
      baseline,
      actual,
      score: result.mssim,
      passed: result.mssim >= options.threshold,
    });
  }

  const passed = comparisons.every((comparison) => comparison.passed);
  const heatmaps = [];
  if (!passed) {
    for (const comparison of comparisons) {
      const heatmapPath = path.join(options.outputDir, `stage-${comparison.state}-diff.png`);
      await writeFile(heatmapPath, createHeatmap(comparison.baseline, comparison.actual));
      heatmaps.push(heatmapPath);
    }
  } else {
    await Promise.all(STATES.map((state) => (
      rm(path.join(options.outputDir, `stage-${state}-diff.png`), { force: true })
    )));
  }

  const report = {
    schema: "uiadapt-r12-stage-ssim-v1",
    dimensions: EXPECTED_SIZE,
    threshold: options.threshold.toFixed(4),
    passed,
    states: Object.fromEntries(comparisons.map((comparison) => [comparison.state, {
      ssim: comparison.score.toFixed(4),
      passed: comparison.passed,
      baseline: path.relative(ROOT, comparison.baselinePath),
      actual: path.basename(comparison.actualPath),
    }])),
    heatmaps: heatmaps.map((heatmapPath) => path.basename(heatmapPath)),
  };
  const reportPath = path.join(options.outputDir, "stage-ssim.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (options.json) {
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } else {
    for (const comparison of comparisons) {
      process.stdout.write(
        `${comparison.state} SSIM=${comparison.score.toFixed(4)} ${comparison.passed ? "PASS" : "FAIL"}\n`,
      );
    }
    process.stdout.write(`threshold=${options.threshold.toFixed(4)} verdict=${passed ? "PASS" : "FAIL"}\n`);
    process.stdout.write(`report=${path.relative(ROOT, reportPath)}\n`);
    if (heatmaps.length > 0) {
      process.stdout.write(`heatmaps=${heatmaps.map((item) => path.relative(ROOT, item)).join(",")}\n`);
    }
  }

  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
