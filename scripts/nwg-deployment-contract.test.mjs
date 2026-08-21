import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, readdir, rm, rmdir, stat, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
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

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function hashDirectoryTree(root) {
  const hash = createHash("sha256");

  async function visit(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const relativePath = join(relativeDirectory, entry.name);
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        hash.update(`directory:${relativePath}\0`);
        await visit(absolutePath, relativePath);
      } else if (entry.isFile()) {
        hash.update(`file:${relativePath}\0`);
        hash.update(await readFile(absolutePath));
      } else {
        assert.fail(`unsupported entry in project www tree: ${relativePath}`);
      }
    }
  }

  await visit(root);
  return hash.digest("hex");
}

async function removeOwnedEmptyDirectory(path) {
  try {
    await rmdir(path);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTEMPTY" || error.code === "EEXIST") return;
    throw error;
  }
}

async function closeServer(server) {
  if (!server.listening) return;
  server.close();
  await once(server, "close");
}

async function isLoopbackPortListening(port) {
  return new Promise((resolveListening) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    let settled = false;
    const settle = (listening) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolveListening(listening);
    };
    socket.once("connect", () => settle(true));
    socket.once("error", () => settle(false));
    socket.setTimeout(500, () => settle(false));
  });
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

function isStrictlyBelow(parent, candidate) {
  const relativePath = relative(resolve(parent), resolve(candidate));
  return relativePath !== ""
    && relativePath !== ".."
    && !relativePath.startsWith(`..${sep}`)
    && !isAbsolute(relativePath);
}

async function runCanonicalIntegration({
  wwwRoot: configuredWwwRoot,
  staticPort: configuredStaticPort,
} = {}) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "uiadapt-nwg-contract-"));
  const cleanupRoot = join(temporaryRoot, "workspace");
  const sourceRoot = join(projectRoot, "dist");
  const wwwRoot = configuredWwwRoot ?? join(cleanupRoot, "www");
  const releaseRoot = join(wwwRoot, "uiadapt_demo");
  const passwordFile = join(cleanupRoot, "password");
  const password = "deployment-contract-password";
  let staticProcess;
  let gatewayProcess;

  try {
    assert.ok(
      isStrictlyBelow(temporaryRoot, cleanupRoot),
      "cleanup target must stay strictly below the temporary root",
    );
    assert.ok(
      isStrictlyBelow(temporaryRoot, wwwRoot),
      "staging root must stay strictly below the temporary root",
    );
    assert.ok(
      isStrictlyBelow(wwwRoot, releaseRoot),
      "release root must stay strictly below the staging root",
    );

    await mkdir(cleanupRoot, { recursive: true });
    await writeFile(passwordFile, `${password}\n`, "utf8");
    const releaseResult = process.platform === "win32"
      ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npm run build"], {
        cwd: projectRoot,
        encoding: "utf8",
      })
      : spawnSync("npm", ["run", "build"], { cwd: projectRoot, encoding: "utf8" });
    assert.equal(releaseResult.status, 0, `${releaseResult.stdout}${releaseResult.stderr}`);
    const { stageNwg } = await import("./stage-nwg.mjs");
    await stageNwg({ sourceRoot, wwwRoot });
    assert.match(await readFile(join(releaseRoot, "index.html"), "utf8"), /<div id="root"><\/div>/);

    const staticPort = configuredStaticPort ?? await reserveLoopbackPort();
    let gatewayPort = await reserveLoopbackPort();
    while (gatewayPort === staticPort) gatewayPort = await reserveLoopbackPort();
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

    return { gatewayPort, releaseRoot, staticPort, temporaryRoot };
  } finally {
    await stopChild(gatewayProcess);
    await stopChild(staticProcess);
    await rm(cleanupRoot, { force: true, recursive: true });
    await removeOwnedEmptyDirectory(temporaryRoot);
  }
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
    "node --test scripts/nwg-deployment-contract.test.mjs",
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

  assert.match(verifyJob, /node-version: 22[\s\S]*?npm run test:deployment/);
  assert.ok(runtimeContractJob, "runtime-contract job must exist");
  assert.match(runtimeContractJob, /uses: actions\/checkout@v4/);
  assert.match(runtimeContractJob, /node-version: 24/);
  assert.match(runtimeContractJob, /cache: npm/);
  for (const command of [
    "npm ci",
    "npm run test:gateway",
    "npm run test:deployment",
  ]) {
    assert.match(runtimeContractJob, new RegExp(`run: ${command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }
  assert.match(runtimeContractJob, /npm ci[\s\S]*?npm run test:gateway[\s\S]*?npm run test:deployment/);
  assert.doesNotMatch(workflow, /^\s*run: npm run build$/m);
  assert.match(workflow, /^permissions:\s*\r?\n {2}contents: read$/m);
  assert.doesNotMatch(workflow, /^\s*environment:/m);
  assert.doesNotMatch(workflow, /\b(?:wrangler|rsync|scp|ssh|deploy-pages)\b/i);
});

test("README records the investor-stage contract and the complete safe verification order", async () => {
  const readme = await readProjectFile("README.md");
  const commands = [
    "npm ci",
    "npm run lint",
    "npm test",
    "npm run test:gateway",
    "npm run test:deployment",
    "npm run verify:build-bases",
    "npm run build",
    "npm run build:nwg",
    "npm run test:e2e",
    "npm audit --omit=dev --audit-level=high",
  ];

  let previousIndex = -1;
  for (const command of commands) {
    const commandIndex = readme.indexOf(command);
    assert.ok(commandIndex > previousIndex, `${command} must appear once in the documented order`);
    previousIndex = commandIndex;
  }

  assert.match(readme, /Wanted Sans/);
  assert.match(readme, /Same catalog · Same behavior · Different presentation/);
  assert.match(readme, /Behavior → State → Policy → Interface/);
  assert.match(readme, /docs\/investor-stage-nwg-release\.md/);
  assert.match(readme, /docs\/security\/investor-preview-threat-model\.md/);
});

test("release runbook records immutable deployment, readiness, rollback, and measured live status", async () => {
  const runbook = await readProjectFile("docs/investor-stage-nwg-release.md");

  for (const contract of [
    "releases/<SHA>",
    "current",
    "uiadapt-static.service",
    "uiadapt-gateway.service",
    "127.0.0.1:5173",
    "127.0.0.1:4180",
    "/etc/uiadapt-demo/password",
    "root:root",
    "0600",
    "LoadCredential",
    "fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91",
    "R8_NOT_DEPLOYED",
  ]) {
    assert.ok(runbook.includes(contract), `runbook must record ${contract}`);
  }

  assert.match(runbook, /test:deployment[\s\S]*temporary root/i);
  assert.match(runbook, /projectRoot\/www[\s\S]*(?:must not|금지)/i);
  assert.match(runbook, /5173[\s\S]*dynamic port/i);
  assert.match(runbook, /Tailscale Funnel[\s\S]*TLS/i);
  assert.match(runbook, /readiness[\s\S]*authentication[\s\S]*public smoke/i);
  assert.match(runbook, /rollback/i);
  assert.match(runbook, /rotate|rotation/i);
  assert.match(runbook, /secret[\s\S]*(?:must not|금지)[\s\S]*log/i);
  assert.match(runbook, /https:\/\/tailscale\.com\/docs\/reference\/tailscale-cli\/funnel/);
  assert.match(runbook, /https:\/\/www\.freedesktop\.org\/software\/systemd\/man\/latest\/systemd\.exec\.html/);
});

test("tracked threat model states the enforced controls and accepted operational gaps", async () => {
  const threatModel = await readProjectFile("docs/security/investor-preview-threat-model.md");

  for (const contract of [
    "preview content",
    "release integrity",
    "Internet → Tailscale daemon TLS → loopback gateway → static service",
    "Authorization",
    "WebSocket",
    "ubuntu",
    "NoNewPrivileges",
    "ProtectSystem=strict",
    "ProtectHome=true",
  ]) {
    assert.ok(threatModel.includes(contract), `threat model must record ${contract}`);
  }

  assert.match(threatModel, /no application-layer rate limiter/i);
  assert.match(threatModel, /no explicit hop-by-hop header filtering/i);
  assert.match(threatModel, /no explicitly pinned upstream idle timeout/i);
  assert.match(threatModel, /no explicitly pinned WebSocket idle timeout/i);
  assert.match(threatModel, /credential[\s\S]*rotation/i);
  assert.match(threatModel, /fail-closed/i);
  assert.match(threatModel, /https:\/\/tailscale\.com\/docs\/features\/tailscale-funnel/);
  assert.match(threatModel, /https:\/\/nodejs\.org\/api\/http\.html/);
});

test("preserves the existing target when source validation or copying fails", async () => {
  const { stageNwg } = await import("./stage-nwg.mjs");
  const temporaryRoot = await mkdtemp(join(tmpdir(), "uiadapt-nwg-stage-failure-"));
  const sourceRoot = join(temporaryRoot, "dist");
  const wwwRoot = join(temporaryRoot, "www");
  const targetFile = join(wwwRoot, "uiadapt_demo", "existing.bin");
  const existingBytes = Buffer.from([0, 255, 17, 42, 128]);

  try {
    await mkdir(sourceRoot, { recursive: true });
    await mkdir(join(wwwRoot, "uiadapt_demo"), { recursive: true });
    await writeFile(join(sourceRoot, "index.html"), "new release", "utf8");
    await writeFile(targetFile, existingBytes);

    await assert.rejects(
      stageNwg({ sourceRoot: join(temporaryRoot, "missing-dist"), wwwRoot }),
    );
    assert.deepEqual(await readFile(targetFile), existingBytes);

    await assert.rejects(
      stageNwg({
        sourceRoot,
        wwwRoot,
        copy: async () => {
          throw new Error("injected copy failure");
        },
      }),
      /injected copy failure/,
    );
    assert.deepEqual(await readFile(targetFile), existingBytes);
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
});

test("behavior: canonical integration preserves the real project www tree", { timeout: 20_000 }, async () => {
  const projectWwwRoot = join(projectRoot, "www");
  const projectReleaseRoot = join(projectWwwRoot, "uiadapt_demo");
  const wwwExisted = await pathExists(projectWwwRoot);
  const releaseExisted = await pathExists(projectReleaseRoot);
  const sentinelPath = join(projectReleaseRoot, `.r8-sentinel-${randomUUID()}.bin`);
  const sentinelBytes = Buffer.from([0, 17, 42, 128, 255]);

  try {
    await mkdir(projectReleaseRoot, { recursive: true });
    await writeFile(sentinelPath, sentinelBytes, { flag: "wx" });
    const beforeHash = await hashDirectoryTree(projectWwwRoot);

    const result = await runCanonicalIntegration();

    assert.equal(await hashDirectoryTree(projectWwwRoot), beforeHash);
    assert.deepEqual(await readFile(sentinelPath), sentinelBytes);
    assert.ok(resolve(result.releaseRoot).startsWith(`${resolve(result.temporaryRoot)}${sep}`));
    assert.ok(!resolve(result.releaseRoot).startsWith(`${resolve(projectWwwRoot)}${sep}`));
  } finally {
    await rm(sentinelPath, { force: true });
    if (!releaseExisted) await removeOwnedEmptyDirectory(projectReleaseRoot);
    if (!wwwExisted) await removeOwnedEmptyDirectory(projectWwwRoot);
  }
});

test("behavior: canonical integration rejects a project www staging mutation", async () => {
  await assert.rejects(
    runCanonicalIntegration({ wwwRoot: join(projectRoot, "www") }),
    /staging root must stay strictly below the temporary root/,
  );
});

test("behavior: canonical integration rejects an explicitly occupied dynamic static port", { timeout: 20_000 }, async () => {
  const dummyServer = net.createServer((socket) => socket.destroy());
  dummyServer.listen(0, "127.0.0.1");
  await once(dummyServer, "listening");
  const { port: occupiedPort } = dummyServer.address();

  try {
    await assert.rejects(
      runCanonicalIntegration({ staticPort: occupiedPort }),
      new RegExp(`http://127\\.0\\.0\\.1:${occupiedPort}/uiadapt_demo/ did not become ready`),
    );
  } finally {
    await closeServer(dummyServer);
  }
});

test("behavior: canonical integration succeeds while port 5173 is externally occupied", { timeout: 20_000 }, async () => {
  let ownedServer;
  if (!await isLoopbackPortListening(5173)) {
    ownedServer = net.createServer((socket) => socket.destroy());
    try {
      ownedServer.listen(5173, "127.0.0.1");
      await once(ownedServer, "listening");
    } catch (error) {
      if (error.code !== "EADDRINUSE") throw error;
      ownedServer = undefined;
    }
  }

  try {
    const result = await runCanonicalIntegration();
    assert.notEqual(result.staticPort, 5173);
  } finally {
    if (ownedServer) await closeServer(ownedServer);
  }
});

test("canonical integration owns staging and cleanup below a temporary root", async () => {
  const source = await readProjectFile("scripts/nwg-deployment-contract.test.mjs");
  const canonicalIntegration = source.slice(
    source.indexOf("async function runCanonicalIntegration"),
    source.indexOf("\nfunction assertCommonServiceContract"),
  );

  assert.doesNotMatch(canonicalIntegration, /join\(projectRoot, "www"\)/);
  assert.doesNotMatch(canonicalIntegration, /const staticPort = 5173/);
  assert.doesNotMatch(canonicalIntegration, /rm\(releaseRoot,/);
  assert.match(canonicalIntegration, /const cleanupRoot = join\(temporaryRoot, "workspace"\)/);
  assert.match(canonicalIntegration, /const wwwRoot = configuredWwwRoot \?\? join\(cleanupRoot, "www"\)/);
  assert.match(canonicalIntegration, /await rm\(cleanupRoot, \{ force: true, recursive: true \}\)/);
  assert.match(canonicalIntegration, /await removeOwnedEmptyDirectory\(temporaryRoot\)/);
});

test("canonical build:nwg release is served through the static and gateway contracts", { timeout: 20_000 }, async () => {
  await runCanonicalIntegration();
});
