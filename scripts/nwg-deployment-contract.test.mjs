import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const projectRoot = join(import.meta.dirname, "..");
const deployRoot = "/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo";
const currentRoot = `${deployRoot}/current`;

async function readProjectFile(path) {
  try {
    return await readFile(join(projectRoot, path), "utf8");
  } catch (error) {
    assert.fail(`${path} must exist and be readable: ${error.message}`);
  }
}

async function readJson(path) {
  return JSON.parse(await readProjectFile(path));
}

function assertCommonServiceContract(service) {
  for (const directive of [
    "User=ubuntu",
    "Group=ubuntu",
    `WorkingDirectory=${currentRoot}`,
    "Restart=on-failure",
    "RestartSec=2",
    "NoNewPrivileges=true",
    "PrivateTmp=true",
    "ProtectSystem=strict",
    "ProtectHome=true",
    "WantedBy=multi-user.target",
  ]) {
    assert.match(service, new RegExp(`^${directive.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"));
  }
}

test("pins a non-SPA static server to the production loopback endpoint", async () => {
  const packageJson = await readJson("package.json");
  const packageLock = await readJson("package-lock.json");

  assert.equal(packageJson.dependencies.serve, "14.2.6");
  assert.equal(packageLock.packages[""].dependencies.serve, "14.2.6");
  assert.equal(packageLock.packages["node_modules/serve"].version, "14.2.6");
  assert.equal(
    packageJson.scripts["serve:static"],
    "serve --no-clipboard --no-port-switching --listen tcp://127.0.0.1:5173 www",
  );
  assert.doesNotMatch(packageJson.scripts["serve:static"], /(?:^|\s)(?:-s|--single)(?:\s|$)/);
});

test("defines hardened static and gateway systemd units for the exact current release", async () => {
  const staticService = await readProjectFile("deploy/systemd/uiadapt-static.service");
  const gatewayService = await readProjectFile("deploy/systemd/uiadapt-gateway.service");

  assertCommonServiceContract(staticService);
  assert.match(
    staticService,
    new RegExp(`^ExecStart=${currentRoot}/node_modules/\\.bin/serve --no-clipboard --no-port-switching --listen tcp://127\\.0\\.0\\.1:5173 ${currentRoot}/www$`, "m"),
  );
  assert.doesNotMatch(staticService, /(?:^|\s)(?:-s|--single)(?:\s|$)/);

  assertCommonServiceContract(gatewayService);
  assert.match(gatewayService, /^Requires=uiadapt-static\.service$/m);
  assert.match(gatewayService, /^After=uiadapt-static\.service$/m);
  assert.match(
    gatewayService,
    new RegExp(`^ExecStart=/usr/bin/node ${currentRoot}/scripts/password-gateway\\.mjs$`, "m"),
  );
  assert.match(gatewayService, /^LoadCredential=uiadapt-password:\/etc\/uiadapt-demo\/password$/m);
  assert.match(gatewayService, /^Environment=UIADAPT_GATEWAY_PASSWORD_FILE=%d\/uiadapt-password$/m);
  assert.match(gatewayService, /^Environment=UIADAPT_GATEWAY_USER=reviewer$/m);
  assert.match(gatewayService, /^Environment=UIADAPT_GATEWAY_PORT=4180$/m);
  assert.match(gatewayService, /^Environment=UIADAPT_GATEWAY_UPSTREAM=http:\/\/127\.0\.0\.1:5173$/m);
  assert.doesNotMatch(gatewayService, /^Environment=UIADAPT_GATEWAY_PASSWORD=/m);

  const gatewaySource = await readProjectFile("scripts/password-gateway.mjs");
  assert.match(gatewaySource, /^const DEFAULT_HOST = "127\.0\.0\.1";$/m);
});

test("runs deployment contracts in the Node 22 and Node 24 verification jobs", async () => {
  const workflow = await readProjectFile(".github/workflows/verify.yml");
  const [verifyJob, runtimeContractJob] = workflow.split(/^ {2}runtime-contract:\s*$/m);

  assert.match(verifyJob, /node-version: 22[\s\S]*?npm run build[\s\S]*?npm run test:deployment/);
  assert.ok(runtimeContractJob, "runtime-contract job must exist");
  assert.match(runtimeContractJob, /uses: actions\/checkout@v4/);
  assert.match(runtimeContractJob, /node-version: 24/);
  assert.match(runtimeContractJob, /cache: npm/);
  for (const command of [
    "npm ci",
    "npm run build",
    "npm run test:gateway",
    "npm run test:deployment",
  ]) {
    assert.match(runtimeContractJob, new RegExp(`run: ${command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }
  assert.match(runtimeContractJob, /npm ci[\s\S]*?npm run build[\s\S]*?npm run test:gateway[\s\S]*?npm run test:deployment/);
  assert.match(workflow, /^permissions:\s*\r?\n {2}contents: read$/m);
  assert.doesNotMatch(workflow, /^\s*environment:/m);
  assert.doesNotMatch(workflow, /\b(?:wrangler|rsync|scp|ssh|deploy-pages)\b/i);
});
