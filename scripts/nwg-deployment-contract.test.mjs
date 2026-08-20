import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { clearTimeout, setTimeout } from "node:timers";
import { URL } from "node:url";

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

function basicAuth(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

async function reserveLoopbackPort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  server.close();
  await once(server, "close");
  return port;
}

function launchNode(modulePath, args, env = process.env) {
  const child = spawn(process.execPath, [modulePath, ...args], {
    cwd: projectRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = [];
  child.stdout.on("data", (chunk) => output.push(chunk));
  child.stderr.on("data", (chunk) => output.push(chunk));
  return { child, output: () => Buffer.concat(output).toString("utf8") };
}

async function stopChild(processHandle) {
  if (!processHandle) return;
  if (processHandle.child.exitCode === null) {
    processHandle.child.kill();
    let timeout;
    try {
      await Promise.race([
        once(processHandle.child, "exit"),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error("child process did not terminate")), 5_000);
        }),
      ]);
    } finally {
      clearTimeout(timeout);
    }
  }
  assert.ok(
    processHandle.child.exitCode !== null || processHandle.child.signalCode !== null,
    processHandle.output(),
  );
}

async function waitForStatus(url, status, options, processHandle) {
  let lastError;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (processHandle.child.exitCode !== null) {
      assert.fail(`child exited before ${url} became ready:\n${processHandle.output()}`);
    }
    try {
      const response = await globalThis.fetch(url, options);
      if (response.status === status) return response;
      lastError = new Error(`expected ${status}, received ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.fail(`${url} did not become ready: ${lastError?.message}\n${processHandle.output()}`);
}

function expectedAssetMime(pathname) {
  if (pathname.endsWith(".js")) return /^(?:application|text)\/javascript\b/;
  if (pathname.endsWith(".css")) return /^text\/css\b/;
  if (pathname.endsWith(".woff2")) return /^font\/woff2\b/;
  if (pathname.endsWith(".woff")) return /^(?:application\/font-woff|font\/woff)\b/;
  if (pathname.endsWith(".ttf")) return /^font\/ttf\b/;
  if (pathname.endsWith(".otf")) return /^font\/otf\b/;
  assert.fail(`unexpected asset extension: ${pathname}`);
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
  assert.equal(packageJson.scripts["stage:nwg"], "node scripts/stage-nwg.mjs");
  assert.equal(packageJson.scripts["build:nwg"], "npm run build && npm run stage:nwg");
  assert.equal(
    packageJson.scripts["test:deployment"],
    "npm run build && node --test scripts/nwg-deployment-contract.test.mjs",
  );
  assert.doesNotMatch(packageJson.scripts["serve:static"], /(?:^|\s)(?:-s|--single)(?:\s|$)/);

  const gitignore = await readProjectFile(".gitignore");
  assert.match(gitignore, /^\/www\/$/m);
});

test("defines hardened static and gateway systemd units for the exact current release", async () => {
  const staticService = await readProjectFile("deploy/systemd/uiadapt-static.service");
  const gatewayService = await readProjectFile("deploy/systemd/uiadapt-gateway.service");

  assertCommonServiceContract(staticService);
  assert.match(
    staticService,
    new RegExp(`^ExecStart=${currentRoot}/node_modules/\\.bin/serve --no-clipboard --no-port-switching --listen tcp://127\\.0\\.0\\.1:5173 ${currentRoot}/www$`, "m"),
  );
  assert.match(staticService, /^Environment=NO_UPDATE_CHECK=1$/m);
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

test("stages and serves the built nested application through the real gateway", { timeout: 20_000 }, async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "uiadapt-nwg-contract-"));
  const wwwRoot = join(temporaryRoot, "www");
  const passwordFile = join(temporaryRoot, "password");
  const password = "deployment-contract-password";
  let staticProcess;
  let gatewayProcess;

  try {
    await writeFile(passwordFile, `${password}\n`, "utf8");
    await mkdir(join(wwwRoot, "uiadapt_demo"), { recursive: true });
    await writeFile(join(wwwRoot, "sibling.txt"), "preserve sibling", "utf8");
    await writeFile(join(wwwRoot, "uiadapt_demo", "stale.txt"), "remove stale target", "utf8");
    const stageResult = spawnSync(
      process.execPath,
      [join(projectRoot, "scripts", "stage-nwg.mjs"), wwwRoot],
      { cwd: projectRoot, encoding: "utf8" },
    );
    assert.equal(stageResult.status, 0, `${stageResult.stdout}${stageResult.stderr}`);
    assert.equal(await readFile(join(wwwRoot, "sibling.txt"), "utf8"), "preserve sibling");
    await assert.rejects(
      readFile(join(wwwRoot, "uiadapt_demo", "stale.txt"), "utf8"),
      { code: "ENOENT" },
    );

    const staticPort = await reserveLoopbackPort();
    const gatewayPort = await reserveLoopbackPort();
    staticProcess = launchNode(
      join(projectRoot, "node_modules", "serve", "build", "main.js"),
      [
        "--no-clipboard",
        "--no-port-switching",
        "--listen",
        `tcp://127.0.0.1:${staticPort}`,
        wwwRoot,
      ],
      { ...process.env, NO_UPDATE_CHECK: "1" },
    );
    await waitForStatus(
      `http://127.0.0.1:${staticPort}/uiadapt_demo/`,
      200,
      {},
      staticProcess,
    );

    gatewayProcess = launchNode(
      join(projectRoot, "scripts", "password-gateway.mjs"),
      [],
      {
        ...process.env,
        UIADAPT_GATEWAY_PASSWORD_FILE: passwordFile,
        UIADAPT_GATEWAY_PORT: String(gatewayPort),
        UIADAPT_GATEWAY_UPSTREAM: `http://127.0.0.1:${staticPort}`,
        UIADAPT_GATEWAY_USER: "reviewer",
      },
    );
    const gatewayRoot = `http://127.0.0.1:${gatewayPort}`;
    await waitForStatus(`${gatewayRoot}/uiadapt_demo/`, 401, {}, gatewayProcess);

    const wrongResponse = await globalThis.fetch(`${gatewayRoot}/uiadapt_demo/`, {
      headers: { authorization: basicAuth("reviewer", "wrong-password") },
    });
    assert.equal(wrongResponse.status, 401);

    const authorization = basicAuth("reviewer", password);
    const rootResponse = await globalThis.fetch(`${gatewayRoot}/`, {
      headers: { authorization },
      redirect: "manual",
    });
    assert.equal(rootResponse.status, 302);
    assert.equal(rootResponse.headers.get("location"), "/uiadapt_demo/");

    const htmlResponse = await globalThis.fetch(`${gatewayRoot}/uiadapt_demo/`, {
      headers: { authorization },
    });
    assert.equal(htmlResponse.status, 200);
    assert.match(htmlResponse.headers.get("content-type") ?? "", /^text\/html\b/);
    const html = await htmlResponse.text();
    const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
      .map((match) => new URL(match[1], `${gatewayRoot}/uiadapt_demo/`));
    assert.ok(assetUrls.some((url) => url.pathname.endsWith(".js")));
    assert.ok(assetUrls.some((url) => url.pathname.endsWith(".css")));

    const fontUrls = [];
    for (const assetUrl of assetUrls) {
      const response = await globalThis.fetch(assetUrl, { headers: { authorization } });
      assert.equal(response.status, 200, assetUrl.href);
      const contentType = response.headers.get("content-type") ?? "";
      assert.doesNotMatch(contentType, /^text\/html\b/, assetUrl.href);
      assert.match(contentType, expectedAssetMime(assetUrl.pathname), assetUrl.href);
      const body = await response.text();
      if (assetUrl.pathname.endsWith(".css")) {
        fontUrls.push(
          ...[...body.matchAll(/url\((?:["'])?([^"')]+\.(?:woff2?|ttf|otf))(?:["'])?\)/g)]
            .map((match) => new URL(match[1], assetUrl)),
        );
      }
    }

    assert.ok(fontUrls.length > 0, "built CSS must reference at least one font asset");
    for (const fontUrl of fontUrls) {
      const response = await globalThis.fetch(fontUrl, { headers: { authorization } });
      assert.equal(response.status, 200, fontUrl.href);
      const contentType = response.headers.get("content-type") ?? "";
      assert.doesNotMatch(contentType, /^text\/html\b/, fontUrl.href);
      assert.match(contentType, expectedAssetMime(fontUrl.pathname), fontUrl.href);
    }
  } finally {
    await stopChild(gatewayProcess);
    await stopChild(staticProcess);
    await rm(temporaryRoot, { force: true, recursive: true });
  }
});
