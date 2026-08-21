import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, readdir, rm, rmdir, stat, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import process from "node:process";
import test from "node:test";
import { clearInterval, clearTimeout, setInterval, setTimeout } from "node:timers";
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
  const apiService = await readProjectFile("deploy/systemd/uiadapt-api.service");

  assertCommonServiceContract(staticService);
  assert.match(
    staticService,
    new RegExp(`^ExecStart=${currentRoot}/node_modules/\\.bin/serve --no-clipboard --no-port-switching --listen tcp://127\\.0\\.0\\.1:5173 ${currentRoot}/www$`, "m"),
  );
  assert.match(staticService, /^Environment=NO_UPDATE_CHECK=1$/m);
  assert.doesNotMatch(staticService, /(?:^|\s)(?:-s|--single)(?:\s|$)/);

  assertCommonServiceContract(gatewayService);
  assert.match(gatewayService, /^Requires=uiadapt-static\.service$/m);
  assert.match(gatewayService, /^Wants=uiadapt-api\.service$/m);
  assert.match(gatewayService, /^After=uiadapt-static\.service uiadapt-api\.service$/m);
  assert.match(
    gatewayService,
    new RegExp(`^ExecStart=/usr/bin/node ${currentRoot}/scripts/password-gateway\\.mjs$`, "m"),
  );
  assert.match(gatewayService, /^LoadCredential=uiadapt-password:\/etc\/uiadapt-demo\/password$/m);
  assert.match(gatewayService, /^Environment=UIADAPT_GATEWAY_PASSWORD_FILE=%d\/uiadapt-password$/m);
  assert.match(gatewayService, /^Environment=UIADAPT_GATEWAY_USER=reviewer$/m);
  assert.match(gatewayService, /^Environment=UIADAPT_GATEWAY_PORT=4180$/m);
  assert.match(gatewayService, /^Environment=UIADAPT_GATEWAY_UPSTREAM=http:\/\/127\.0\.0\.1:5173$/m);
  assert.match(gatewayService, /^Environment=UIADAPT_GATEWAY_API_UPSTREAM=http:\/\/127\.0\.0\.1:4181$/m);
  assert.doesNotMatch(gatewayService, /^Environment=UIADAPT_GATEWAY_PASSWORD=/m);

  assertCommonServiceContract(apiService);
  assert.match(apiService, new RegExp(`^ExecStart=/usr/bin/node ${currentRoot}/server/uiadapt-api\\.mjs$`, "m"));
  assert.match(apiService, /^LoadCredential=uiadapt-mysql-password:\/etc\/uiadapt-demo\/mysql-password$/m);
  assert.match(apiService, /^Environment=UIADAPT_MYSQL_PASSWORD_FILE=%d\/uiadapt-mysql-password$/m);
  assert.match(apiService, /^Environment=UIADAPT_DB_USER=uiadapt_demo_app$/m);
  assert.match(apiService, /^Environment=UIADAPT_API_HOST=127\.0\.0\.1$/m);
  assert.match(apiService, /^Environment=UIADAPT_API_PORT=4181$/m);
  assert.doesNotMatch(apiService, /UIADAPT_MYSQL_PASSWORD=/);

  const gatewaySource = await readProjectFile("scripts/password-gateway.mjs");
  assert.match(gatewaySource, /^const DEFAULT_HOST = "127\.0\.0\.1";$/m);
});

test("runs deployment contracts in the Node 22 and Node 24 verification jobs", async () => {
  const workflow = await readProjectFile(".github/workflows/verify.yml");
  const [verifyJob, runtimeContractJob] = workflow.split(/^ {2}runtime-contract:\s*$/m);

  assert.match(verifyJob, /node-version: 22[\s\S]*?npm run test:deployment/);
  assert.match(verifyJob, /npm run test:api/);
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
  const apiIntegrationJob = workflow.match(/^ {2}api-integration:[\s\S]*$/m)?.[0];
  assert.ok(apiIntegrationJob, "api-integration job must exist");
  assert.match(apiIntegrationJob, /image: mysql:8\.0/);
  assert.match(apiIntegrationJob, /MYSQL_ALLOW_EMPTY_PASSWORD: "yes"/);
  assert.match(apiIntegrationJob, /openssl rand -hex 32/);
  assert.match(apiIntegrationJob, /GITHUB_ENV/);
  assert.doesNotMatch(apiIntegrationJob, /UIADAPT_CI_MYSQL_(?:ROOT|APP)_PASSWORD/);
  assert.match(apiIntegrationJob, /db\/001-uiadapt-demo\.sql/);
  assert.match(apiIntegrationJob, /UIADAPT_INTEGRATION: "1"/);
  assert.match(apiIntegrationJob, /--health-cmd="mysqladmin ping -h 127\.0\.0\.1 -uroot --silent"/);
  assert.match(apiIntegrationJob, /CREATE USER IF NOT EXISTS 'uiadapt_demo_app'@'%'/);
  assert.match(apiIntegrationJob, /GRANT SELECT, INSERT, LOCK TABLES ON uiadapt_demo\.\* TO 'uiadapt_demo_app'@'%'/);
  assert.doesNotMatch(apiIntegrationJob, /uiadapt_demo_app'@'127\.0\.0\.1'/);
  assert.doesNotMatch(apiIntegrationJob, /GRANT [^\n]*\b(?:UPDATE|DELETE)\b/);
  assert.match(apiIntegrationJob, /npm run test:api-integration/);
  assert.doesNotMatch(workflow, /^\s*run: npm run build$/m);
  assert.match(workflow, /^permissions:\s*\r?\n {2}contents: read$/m);
  assert.doesNotMatch(workflow, /^\s*environment:/m);
  assert.doesNotMatch(workflow, /\b(?:wrangler|rsync|scp|ssh|deploy-pages)\b/i);
});

test("runs verification pushes for main, R8 remediation, and the distribution candidate", async () => {
  const workflow = await readProjectFile(".github/workflows/verify.yml");
  const pushBranches = workflow.match(
    /^ {2}push:\s*\r?\n {4}branches:\s*\[([^\]]+)\]$/m,
  );
  const pullRequestBranches = workflow.match(
    /^ {2}pull_request:\s*\r?\n {4}branches:\s*\[([^\]]+)\]$/m,
  );

  assert.ok(pushBranches, "push branch filter must exist");
  assert.deepEqual(
    pushBranches[1].split(",").map((branch) => branch.trim()),
    ["main", "codex/uiadapt-investor-r8-remediation", "codex/uiadapt-distribution-engine-v1"],
  );
  assert.ok(pullRequestBranches, "pull_request branch filter must exist");
  assert.deepEqual(
    pullRequestBranches[1].split(",").map((branch) => branch.trim()),
    ["main"],
  );
  assert.doesNotMatch(workflow, /^\s*environment:/m);
  assert.doesNotMatch(workflow, /\b(?:wrangler|rsync|scp|ssh|deploy-pages)\b/i);
});

test("README records the investor-stage contract and the complete safe verification order", async () => {
  const readme = await readProjectFile("README.md");
  const commands = [
    "npm ci",
    "npm run lint",
    "npm test",
    "npm run test:api",
    "npm run test:gateway",
    "npm run test:deployment",
    "npm run verify:build-bases",
    "npm run build",
    "npm run build:nwg",
    "npm run test:e2e",
    "npm audit --omit=dev --audit-level=high",
  ];

  const verificationBlock = readme.match(
    /## 전체 검증 순서[\s\S]*?```powershell\r?\n([\s\S]*?)```/,
  );
  assert.ok(verificationBlock, "README must contain the PowerShell verification block");
  const documentedCommands = verificationBlock[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  assert.deepEqual(documentedCommands, commands);

  assert.match(readme, /Wanted Sans/);
  assert.match(readme, /Same catalog · Same behavior · Different presentation/);
  assert.match(readme, /Behavior → State → Policy → Interface/);
  assert.match(readme, /docs\/investor-stage-nwg-release\.md/);
  assert.match(readme, /docs\/security\/investor-preview-threat-model\.md/);
  assert.match(readme, /never stages, cleans, or writes projectRoot\/www/i);
});

test("release runbook records version-addressed deployment, readiness, rollback, and measured live status", async () => {
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
  assert.match(runbook, /version-addressed release/i);
  assert.match(runbook, /deployment-time archive\/manifest hash verification/i);
  assert.match(runbook, /no filesystem immutable bit/i);
  assert.match(runbook, /no root-owned read-only enforcement/i);
  assert.match(runbook, /ubuntu ownership is a residual risk/i);
  assert.doesNotMatch(runbook, /immutable (?:release|releases)/i);

  const plan = await readProjectFile("docs/superpowers/plans/2026-08-21-uiadapt-r8-remediation.md");
  assert.match(plan, /version-addressed releases with deployment-time hash verification/i);
  assert.match(plan, /no filesystem immutability enforcement/i);
  assert.doesNotMatch(plan, /Document immutable releases/i);

  for (const command of [
    'DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"',
    'PREVIOUS_TARGET="$(readlink -f "$DEPLOY_ROOT/current")"',
    'ln -s "releases/$NEW_SHA" "$DEPLOY_ROOT/current.new"',
    'mv -T "$DEPLOY_ROOT/current.new" "$DEPLOY_ROOT/current"',
    "systemctl daemon-reload",
    "systemctl restart uiadapt-static.service uiadapt-gateway.service",
    "rollback() {",
    "trap 'rollback' ERR",
    "trap - ERR",
    "node <<'NODE'",
    'readFileSync(process.env.UIADAPT_SMOKE_PASSWORD_FILE, "utf8")',
    'raw.endsWith("\\r\\n") ? raw.slice(0, -2)',
    'raw.endsWith("\\n") ? raw.slice(0, -1)',
    'Buffer.from(`reviewer:${password}`).toString("base64")',
    'const timeoutMs = Number(process.env.UIADAPT_SMOKE_TIMEOUT_MS ?? "10000")',
    "signal: AbortSignal.timeout(timeoutMs)",
  ]) {
    assert.ok(runbook.includes(command), `runbook must provide fail-closed command: ${command}`);
  }
  assert.match(runbook, /stat -c %d[\s\S]*NEW_RELEASE/);
  assert.match(runbook, /readlink -f[\s\S]*\/releases\//);
  assert.match(runbook, /8443[\s\S]*(?:must not|금지)[\s\S]*8787/i);
  assert.match(runbook, /never stages, cleans, or writes projectRoot\/www/i);
  assert.doesNotMatch(runbook, /curl\s+(?:[^\n]*\s)?(?:--user|-u)(?:\s|=)/);
  assert.doesNotMatch(runbook, /AUTH_CONFIG|REVIEW_PASSWORD|curl --config/);
  assert.match(runbook, /console\.log\(`AUTH_STATUS=\$\{status\}`\)/);
  assert.doesNotMatch(runbook, /AUTH_ERROR|console\.error/);

  const automaticSection = runbook.slice(
    runbook.indexOf("### Automated fail-closed switch"),
    runbook.indexOf("### Manual rollback"),
  );
  const automaticScripts = [...automaticSection.matchAll(/```bash\r?\n([\s\S]*?)```/g)];
  assert.equal(automaticScripts.length, 1, "switch, rollback trap, and smoke must share one Bash process");
  const automaticScript = automaticScripts[0][1];
  assert.match(automaticScript, /rollback\(\) \{\r?\n\s+local failure_status=\$\?/);
  assert.match(automaticScript, /rollback\(\)[\s\S]*exit "\$failure_status"/);
  const automaticCurlCount = (automaticScript.match(/\bcurl\b/g) ?? []).length;
  assert.ok(automaticCurlCount > 0);
  assert.equal(
    (automaticScript.match(/--connect-timeout\s+\d+/g) ?? []).length,
    automaticCurlCount,
    "every automated curl request must bound connection time",
  );
  assert.equal(
    (automaticScript.match(/--max-time\s+\d+/g) ?? []).length,
    automaticCurlCount,
    "every automated curl request must bound total time",
  );
  assert.doesNotMatch(automaticScript, /request\.setTimeout/);
  for (const [earlier, later] of [
    ['PREVIOUS_TARGET="$(readlink -f "$DEPLOY_ROOT/current")"', "rollback() {"],
    ["rollback() {", "trap 'rollback' ERR"],
    ["trap 'rollback' ERR", 'ln -s "releases/$NEW_SHA" "$DEPLOY_ROOT/current.new"'],
    ['mv -T "$DEPLOY_ROOT/current.new" "$DEPLOY_ROOT/current"', "systemctl daemon-reload"],
    ["systemctl restart uiadapt-static.service uiadapt-gateway.service", "smoke"],
    ["smoke", "trap - ERR"],
  ]) {
    assert.ok(
      automaticScript.indexOf(earlier) < automaticScript.lastIndexOf(later),
      `${earlier} must precede ${later}`,
    );
  }

  const manualSection = runbook.slice(
    runbook.indexOf("### Manual rollback"),
    runbook.indexOf("## 4. Credential"),
  );
  assert.doesNotMatch(manualSection, /PREVIOUS_TARGET/);
  const manualScripts = [...manualSection.matchAll(/```bash\r?\n([\s\S]*?)```/g)];
  assert.equal(manualScripts.length, 1, "manual rollback must be one self-contained Bash process");
  const manualScript = manualScripts[0][1];
  assert.match(manualScript, /manual_recover\(\) \{\r?\n\s+local failure_status=\$\?/);
  assert.match(manualScript, /manual_recover\(\)[\s\S]*exit "\$failure_status"/);
  const manualCurlCount = (manualScript.match(/\bcurl\b/g) ?? []).length;
  assert.ok(manualCurlCount > 0);
  assert.equal(
    (manualScript.match(/--connect-timeout\s+\d+/g) ?? []).length,
    manualCurlCount,
    "every manual curl request must bound connection time",
  );
  assert.equal(
    (manualScript.match(/--max-time\s+\d+/g) ?? []).length,
    manualCurlCount,
    "every manual curl request must bound total time",
  );
  for (const contract of [
    "manual_auth_smoke() {",
    "node <<'NODE'",
    'readFileSync(process.env.UIADAPT_SMOKE_PASSWORD_FILE, "utf8")',
    'raw.endsWith("\\r\\n") ? raw.slice(0, -2)',
    'raw.endsWith("\\n") ? raw.slice(0, -1)',
    'Buffer.from(`reviewer:${password}`).toString("base64")',
    'const timeoutMs = Number(process.env.UIADAPT_SMOKE_TIMEOUT_MS ?? "10000")',
    "signal: AbortSignal.timeout(timeoutMs)",
    'manual_auth_smoke "http://127.0.0.1:4180/uiadapt_demo/"',
    'manual_auth_smoke "$PUBLIC_URL"',
    "manual_recover() {",
    "trap 'manual_recover' ERR",
  ]) {
    assert.ok(manualScript.includes(contract), `manual rollback must contain ${contract}`);
  }
  for (const command of [
    'ROLLBACK_SHA="${ROLLBACK_SHA:?set the exact prior 40-character lowercase Git SHA}"',
    'ROLLBACK_TARGET="$DEPLOY_ROOT/releases/$ROLLBACK_SHA"',
    'ln -s "releases/$ROLLBACK_SHA" "$DEPLOY_ROOT/current.rollback.new"',
    'mv -T "$DEPLOY_ROOT/current.rollback.new" "$DEPLOY_ROOT/current"',
  ]) {
    assert.ok(manualSection.includes(command), `manual rollback must recompute target: ${command}`);
  }
  assert.doesNotMatch(manualScript, /request\.setTimeout/);
  for (const [earlier, later] of [
    ['CURRENT_TARGET="$(readlink -f "$DEPLOY_ROOT/current")"', "manual_recover() {"],
    ["manual_recover() {", "trap 'manual_recover' ERR"],
    ["trap 'manual_recover' ERR", 'ln -s "releases/$ROLLBACK_SHA" "$DEPLOY_ROOT/current.rollback.new"'],
    ['manual_auth_smoke "$PUBLIC_URL"', "trap - ERR"],
  ]) {
    assert.ok(
      manualScript.indexOf(earlier) < manualScript.lastIndexOf(later),
      `${earlier} must precede ${later}`,
    );
  }
});

test("documented switch and rollback poll bounded readiness after every restart", { timeout: 10_000 }, async () => {
  const runbook = await readProjectFile("docs/investor-stage-nwg-release.md");
  const automaticSection = runbook.slice(
    runbook.indexOf("### Automated fail-closed switch"),
    runbook.indexOf("### Manual rollback"),
  );
  const manualSection = runbook.slice(
    runbook.indexOf("### Manual rollback"),
    runbook.indexOf("## 4. Credential"),
  );
  const automaticScript = automaticSection.match(/```bash\r?\n([\s\S]*?)```/)?.[1] ?? "";
  const manualScript = manualSection.match(/```bash\r?\n([\s\S]*?)```/)?.[1] ?? "";
  const readinessMatch = automaticScript.match(/wait_for_readiness\(\) \{[\s\S]*?\r?\n\}/);

  assert.ok(readinessMatch, "automatic switch must define a readiness helper");
  assert.match(readinessMatch[0], /for \(\(attempt=1; attempt<=max_attempts; attempt\+\+\)\)/);
  assert.doesNotMatch(readinessMatch[0], /while\s+(?:true|:)/);
  assert.match(readinessMatch[0], /--connect-timeout\s+\d+/);
  assert.match(readinessMatch[0], /--max-time\s+\d+/);
  assert.match(readinessMatch[0], /127\.0\.0\.1:5173\/uiadapt_demo/);
  assert.match(readinessMatch[0], /127\.0\.0\.1:4180\/uiadapt_demo/);

  for (const [name, script] of [
    ["automatic switch", automaticScript],
    ["manual rollback", manualScript],
  ]) {
    assert.equal(
      (script.match(/systemctl restart uiadapt-static\.service uiadapt-gateway\.service/g) ?? []).length,
      2,
      `${name} must retain exactly two restart paths`,
    );
    assert.equal(
      (script.match(/^\s*wait_for_readiness(?:\s|$)/gm) ?? []).length,
      2,
      `${name} must wait after its primary and recovery restarts`,
    );
    assert.match(
      script,
      /systemctl restart uiadapt-static\.service uiadapt-gateway\.service[^\n]*\r?\n\s*wait_for_readiness/,
      `${name} must wait immediately after restart`,
    );
  }
  assert.match(
    automaticScript,
    /systemctl restart uiadapt-static\.service uiadapt-gateway\.service \|\| exit "\$failure_status"\r?\n\s*wait_for_readiness \|\| exit "\$failure_status"/,
  );
  assert.match(
    manualScript,
    /systemctl restart uiadapt-static\.service uiadapt-gateway\.service \|\| exit "\$failure_status"\r?\n\s*wait_for_readiness \|\| exit "\$failure_status"/,
  );

  const command = process.platform === "win32" ? "C:\\Program Files\\Git\\bin\\bash.exe" : "bash";
  async function runReadinessScenario(staticReadyAfter, gatewayReadyAfter, maxAttempts) {
    const scenario = `
set -Eeuo pipefail
PROBE_FILE="$(mktemp)"
SLEEP_FILE="$(mktemp)"
printf '0' > "$PROBE_FILE"
printf '0' > "$SLEEP_FILE"
STATIC_READY_AFTER="${staticReadyAfter}"
GATEWAY_READY_AFTER="${gatewayReadyAfter}"
systemctl() { return 0; }
curl() {
  if printf '%s\\n' "$*" | grep -q '127.0.0.1:5173'; then
    local static_probes
    static_probes=$(($(cat "$PROBE_FILE") + 1))
    printf '%s' "$static_probes" > "$PROBE_FILE"
    test "$static_probes" -ge "$STATIC_READY_AFTER"
    return
  fi
  test "$(cat "$PROBE_FILE")" -ge "$GATEWAY_READY_AFTER" || return
  printf '401'
}
sleep() {
  local sleep_calls
  sleep_calls=$(($(cat "$SLEEP_FILE") + 1))
  printf '%s' "$sleep_calls" > "$SLEEP_FILE"
}
export PROBE_FILE SLEEP_FILE STATIC_READY_AFTER GATEWAY_READY_AFTER
export -f systemctl curl sleep
${readinessMatch[0]}
set +e
wait_for_readiness "${maxAttempts}" 0
STATUS=$?
set -e
printf 'STATUS=%s\\nSTATIC_PROBES=%s\\nSLEEP_CALLS=%s\\n' \
  "$STATUS" "$(cat "$PROBE_FILE")" "$(cat "$SLEEP_FILE")"
rm -f "$PROBE_FILE" "$SLEEP_FILE"
`;
    const result = spawnSync(command, ["-s"], {
      cwd: projectRoot,
      input: scenario,
      encoding: "utf8",
      timeout: 2_000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    return `${result.stdout}${result.stderr}`;
  }

  const delayedSuccess = await runReadinessScenario(2, 3, 5);
  assert.match(delayedSuccess, /^STATUS=0$/m);
  assert.match(delayedSuccess, /^STATIC_PROBES=3$/m);
  assert.match(delayedSuccess, /^SLEEP_CALLS=2$/m);

  const boundedFailure = await runReadinessScenario(99, 99, 4);
  assert.match(boundedFailure, /^STATUS=1$/m);
  assert.match(boundedFailure, /^STATIC_PROBES=4$/m);
  assert.match(boundedFailure, /^SLEEP_CALLS=3$/m);

  const hangingScenario = `
set -Eeuo pipefail
systemctl() { command sleep 2; }
curl() { return 0; }
export -f systemctl curl
${readinessMatch[0]}
set +e
wait_for_readiness 1 0.5 1
STATUS=$?
set -e
printf 'HANG_STATUS=%s\\n' "$STATUS"
`;
  const hangingStartedAt = Date.now();
  const hangingResult = spawnSync(command, ["-s"], {
    cwd: projectRoot,
    input: hangingScenario,
    encoding: "utf8",
    timeout: 5_000,
  });
  const hangingElapsedMs = Date.now() - hangingStartedAt;
  assert.equal(hangingResult.error, undefined, "hanging systemctl must be cut off by the readiness deadline");
  assert.equal(hangingResult.status, 0, `${hangingResult.stdout}\n${hangingResult.stderr}`);
  assert.match(`${hangingResult.stdout}${hangingResult.stderr}`, /^HANG_STATUS=124$/m);
  assert.ok(hangingElapsedMs < 3_000, `readiness deadline exceeded (${hangingElapsedMs}ms)`);

  const rollbackMatch = automaticScript.match(/rollback\(\) \{[\s\S]*?\r?\n\}/);
  assert.ok(rollbackMatch, "automatic switch must contain rollback recovery");
  for (const recoveryCheck of [
    /127\.0\.0\.1:4180\/uiadapt_demo/,
    /auth_smoke "http:\/\/127\.0\.0\.1:4180\/uiadapt_demo\/" \|\| exit "\$failure_status"/,
    /auth_smoke "\$PUBLIC_URL" \|\| exit "\$failure_status"/,
  ]) {
    assert.match(rollbackMatch[0], recoveryCheck, "rollback must repeat the complete authenticated smoke");
  }
});

test("documented automatic switch preserves the original failure after recovery", { timeout: 10_000 }, async () => {
  const runbook = await readProjectFile("docs/investor-stage-nwg-release.md");
  const automaticSection = runbook.slice(
    runbook.indexOf("### Automated fail-closed switch"),
    runbook.indexOf("### Manual rollback"),
  );
  const scriptMatch = automaticSection.match(/```bash\r?\n([\s\S]*?)```/);
  assert.ok(scriptMatch, "automatic switch recipe must be executable");
  const readinessMatch = scriptMatch[1].match(/wait_for_readiness\(\) \{[\s\S]*?\r?\n\}/);
  assert.ok(readinessMatch, "automatic switch recipe must contain its readiness helper");
  const rollbackMatch = scriptMatch[1].match(/rollback\(\) \{[\s\S]*?\r?\n\}\r?\n\r?\ntrap 'rollback' ERR/);
  assert.ok(rollbackMatch, "automatic switch recipe must contain its rollback trap");

  const oldSha = "b".repeat(40);
  const newSha = "a".repeat(40);
  const scenario = `
set -Eeuo pipefail
OLD_SHA="${oldSha}"
NEW_SHA="${newSha}"
DEPLOY_ROOT="/test-deploy-root"
PUBLIC_URL="https://00-new-world-gpu.tail645adc.ts.net/uiadapt_demo/"
PREVIOUS_TARGET="$DEPLOY_ROOT/releases/$OLD_SHA"
CURRENT_TARGET="$DEPLOY_ROOT/releases/$NEW_SHA"
STAGED_TARGET=""
RESTART_CALLS=0
ln() { STAGED_TARGET="$2"; return 0; }
readlink() {
  local path="\${!#}"
  if test "$path" = "$DEPLOY_ROOT/current.rollback.new"; then
    printf '%s\\n' "$STAGED_TARGET"
  else
    printf '%s\\n' "$CURRENT_TARGET"
  fi
}
mv() { CURRENT_TARGET="$STAGED_TARGET"; return 0; }
systemctl() {
  if test "\${1:-}" = "restart"; then
    RESTART_CALLS=$((RESTART_CALLS + 1))
    if test "$RESTART_CALLS" -eq 1; then return 42; fi
  fi
  return 0
}
curl() {
  if printf '%s\\n' "$*" | grep -q '127.0.0.1:4180'; then printf '401'; fi
  return 0
}
auth_smoke() { printf 'AUTH_RECOVERY=%s\\n' "$1"; return 0; }
export -f systemctl curl
trap 'printf "FINAL_TARGET=%s\\n" "$CURRENT_TARGET"' EXIT
${readinessMatch[0]}
${rollbackMatch[0]}
systemctl restart uiadapt-static.service uiadapt-gateway.service
printf 'SWITCH_STATUS=PASS\\n'
`;

  const command = process.platform === "win32" ? "C:\\Program Files\\Git\\bin\\bash.exe" : "bash";
  const args = ["-s"];
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const output = [];
  child.stdout.on("data", (chunk) => output.push(chunk));
  child.stderr.on("data", (chunk) => output.push(chunk));
  child.stdin.end(scenario);
  const [code, signal] = await once(child, "exit");
  const combinedOutput = Buffer.concat(output).toString("utf8");

  assert.equal(signal, null);
  assert.equal(code, 42, `injected restart failure must survive recovery exactly:\n${combinedOutput}`);
  assert.doesNotMatch(combinedOutput, /SWITCH_STATUS=PASS/);
  assert.match(combinedOutput, new RegExp(`FINAL_TARGET=.*${oldSha}$`, "m"));
  assert.match(combinedOutput, /^AUTH_RECOVERY=http:\/\/127\.0\.0\.1:4180\/uiadapt_demo\/$/m);
  assert.match(combinedOutput, /^AUTH_RECOVERY=https:\/\/00-new-world-gpu\.tail645adc\.ts\.net\/uiadapt_demo\/$/m);
});

test("documented auth helper enforces a total wall-clock deadline against trickle responses", { timeout: 5_000 }, async () => {
  const runbook = await readProjectFile("docs/investor-stage-nwg-release.md");
  const automaticSection = runbook.slice(
    runbook.indexOf("### Automated fail-closed switch"),
    runbook.indexOf("### Manual rollback"),
  );
  const helperMatch = automaticSection.match(/node <<'NODE'\r?\n([\s\S]*?)\r?\nNODE/);
  assert.ok(helperMatch, "automatic switch must embed the executable Node auth helper");

  const temporaryRoot = await mkdtemp(join(tmpdir(), "uiadapt-deadline-contract-"));
  const credentialPath = join(temporaryRoot, "password");
  const password = 'deadline-secret:"\\$[]{}';
  const trickleServer = net.createServer((socket) => {
    let interval;
    socket.once("data", () => {
      socket.write("HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n");
      interval = setInterval(() => {
        if (!socket.destroyed) socket.write("1\r\nx\r\n");
      }, 50);
    });
    socket.once("close", () => clearInterval(interval));
    socket.once("error", () => clearInterval(interval));
  });

  try {
    await writeFile(credentialPath, `${password}\r\n`, "utf8");
    trickleServer.listen(0, "127.0.0.1");
    await once(trickleServer, "listening");
    const { port } = trickleServer.address();
    const child = spawn(process.execPath, ["-e", helperMatch[1]], {
      cwd: projectRoot,
      env: {
        ...process.env,
        UIADAPT_SMOKE_PASSWORD_FILE: credentialPath,
        UIADAPT_SMOKE_TIMEOUT_MS: "200",
        UIADAPT_SMOKE_URL: `http://127.0.0.1:${port}/trickle`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const output = [];
    child.stdout.on("data", (chunk) => output.push(chunk));
    child.stderr.on("data", (chunk) => output.push(chunk));
    const startedAt = Date.now();
    let watchdog;
    const completion = await Promise.race([
      once(child, "exit").then(([code, signal]) => ({ code, signal })),
      new Promise((resolveCompletion) => {
        watchdog = setTimeout(() => resolveCompletion(null), 1_500);
      }),
    ]);
    clearTimeout(watchdog);
    if (!completion) {
      child.kill();
      await once(child, "exit");
    }
    const elapsedMs = Date.now() - startedAt;
    const combinedOutput = Buffer.concat(output).toString("utf8");

    assert.ok(completion, `auth helper exceeded wall-clock bound (${elapsedMs}ms)`);
    assert.notEqual(completion.code, 0);
    assert.ok(elapsedMs < 1_500, `auth helper exceeded wall-clock bound (${elapsedMs}ms)`);
    assert.match(combinedOutput, /^AUTH_STATUS=0$/m);
    assert.equal(combinedOutput.includes(password), false);
  } finally {
    await closeServer(trickleServer);
    await rm(temporaryRoot, { force: true, recursive: true });
  }
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
  assert.match(threatModel, /version-addressed release/i);
  assert.match(threatModel, /deployment-time archive\/manifest hash verification/i);
  assert.match(threatModel, /no filesystem immutable bit/i);
  assert.match(threatModel, /no root-owned read-only enforcement/i);
  assert.match(threatModel, /ubuntu ownership is a residual risk/i);
  assert.doesNotMatch(threatModel, /immutable (?:release|releases)/i);
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
  const wwwExisted = await pathExists(projectWwwRoot);
  const beforeHash = wwwExisted ? await hashDirectoryTree(projectWwwRoot) : null;

  const result = await runCanonicalIntegration();

  const wwwExistsAfter = await pathExists(projectWwwRoot);
  assert.equal(wwwExistsAfter, wwwExisted);
  if (wwwExisted) assert.equal(await hashDirectoryTree(projectWwwRoot), beforeHash);
  assert.ok(resolve(result.releaseRoot).startsWith(`${resolve(result.temporaryRoot)}${sep}`));
  assert.ok(!resolve(result.releaseRoot).startsWith(`${resolve(projectWwwRoot)}${sep}`));
});

test("project www preservation probe is read-only", async () => {
  const source = await readProjectFile("scripts/nwg-deployment-contract.test.mjs");
  const preservationProbe = source.slice(
    source.indexOf('test("behavior: canonical integration preserves the real project www tree"'),
    source.indexOf('test("project www preservation probe is read-only"'),
  );

  assert.doesNotMatch(preservationProbe, /\b(?:mkdir|writeFile|rm|rmdir)\s*\(/);
  assert.match(preservationProbe, /hashDirectoryTree/);
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
