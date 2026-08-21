import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";

async function loadGateway() {
  try {
    return await import("./password-gateway.mjs");
  } catch (error) {
    assert.fail(`password gateway module must exist: ${error.message}`);
  }
}

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}

async function close(server) {
  server.close();
  await once(server, "close");
}

function basicAuth(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

async function temporaryDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), "uiadapt-gateway-"));
  t.after(() => rm(directory, { force: true, recursive: true }));
  return directory;
}

async function requestWithRawPath({ authorization, path, port }) {
  return await new Promise((resolve, reject) => {
    const request = http.request({
      headers: { authorization },
      host: "127.0.0.1",
      path,
      port,
    }, resolve);
    request.on("error", reject);
    request.end();
  });
}

async function upgradeWithRawPath({ authorization, path, port }) {
  return await new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1");
    const chunks = [];
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      const response = chunks.join("");
      socket.destroy();
      resolve(response);
    };
    socket.setEncoding("utf8");
    socket.setTimeout(1_000, finish);
    socket.on("connect", () => {
      const authorizationHeader = authorization
        ? `Authorization: ${authorization}\r\n`
        : "";
      socket.write([
        `GET ${path} HTTP/1.1`,
        "Host: gateway.test",
        "Connection: Upgrade",
        "Upgrade: websocket",
        "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
        "Sec-WebSocket-Version: 13",
        authorizationHeader.trimEnd(),
        "",
        "",
      ].filter((line, index, lines) => line || index >= lines.length - 2).join("\r\n"));
    });
    socket.on("data", (chunk) => {
      chunks.push(chunk);
      const response = chunks.join("");
      if (/^HTTP\/1\.1 401 /m.test(response) && response.includes("Authentication required")) {
        finish();
      }
    });
    socket.on("end", finish);
    socket.on("error", reject);
  });
}

test("fails closed when the required password is missing", async () => {
  const { createPasswordGateway } = await loadGateway();

  assert.throws(
    () => createPasswordGateway({ password: "" }),
    /UIADAPT_GATEWAY_PASSWORD/,
  );
});

test("reads the password file with exactly one trailing LF or CRLF removed", async (t) => {
  const { resolveGatewayPassword } = await loadGateway();
  const directory = await temporaryDirectory(t);

  for (const [filename, contents, expected] of [
    ["lf.txt", "  file-password  \n\n", "  file-password  \n"],
    ["crlf.txt", "file-password\r\n", "file-password"],
  ]) {
    const passwordFile = join(directory, filename);
    await writeFile(passwordFile, contents, "utf8");
    assert.equal(resolveGatewayPassword({
      password: "ignored-environment-password",
      passwordFile,
    }), expected);
  }
});

test("fails closed on a missing password file even when an environment password exists", async (t) => {
  const { resolveGatewayPassword } = await loadGateway();
  const directory = await temporaryDirectory(t);
  const environmentSecret = "environment-secret-must-not-leak";

  assert.throws(
    () => resolveGatewayPassword({
      password: environmentSecret,
      passwordFile: join(directory, "missing-password.txt"),
    }),
    (error) => {
      assert.match(error.message, /UIADAPT_GATEWAY_PASSWORD_FILE/);
      assert.doesNotMatch(error.message, new RegExp(environmentSecret));
      return true;
    },
  );
});

test("fails closed on an empty password file", async (t) => {
  const { resolveGatewayPassword } = await loadGateway();
  const directory = await temporaryDirectory(t);
  const passwordFile = join(directory, "empty-password.txt");
  await writeFile(passwordFile, "", "utf8");

  assert.throws(
    () => resolveGatewayPassword({ password: "fallback-secret", passwordFile }),
    /UIADAPT_GATEWAY_PASSWORD_FILE/,
  );
});

test("fails closed on an unreadable password-file target", async (t) => {
  const { resolveGatewayPassword } = await loadGateway();
  const directory = await temporaryDirectory(t);

  assert.throws(
    () => resolveGatewayPassword({ password: "fallback-secret", passwordFile: directory }),
    /UIADAPT_GATEWAY_PASSWORD_FILE/,
  );
});

test("does not expose either password source when password-file startup fails", async (t) => {
  const directory = await temporaryDirectory(t);
  const fileSecret = "file-secret-must-not-leak";
  const environmentSecret = "environment-secret-must-not-leak";
  const passwordFile = join(directory, `${fileSecret}.txt`);

  const result = spawnSync(process.execPath, [join(import.meta.dirname, "password-gateway.mjs")], {
    encoding: "utf8",
    env: {
      ...process.env,
      UIADAPT_GATEWAY_PASSWORD: environmentSecret,
      UIADAPT_GATEWAY_PASSWORD_FILE: passwordFile,
      UIADAPT_GATEWAY_PORT: "4180",
    },
    timeout: 2_000,
  });
  const output = `${result.stdout}${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /UIADAPT_GATEWAY_PASSWORD_FILE/);
  assert.doesNotMatch(output, new RegExp(fileSecret));
  assert.doesNotMatch(output, new RegExp(environmentSecret));
});

test("keeps the direct environment password compatible when no file is configured", async () => {
  const { resolveGatewayPassword } = await loadGateway();

  assert.equal(resolveGatewayPassword({ password: "direct-environment-password" }), "direct-environment-password");
});

test("starts and authenticates when executed through a symlinked current release", async (t) => {
  const directory = await temporaryDirectory(t);
  const currentPath = join(directory, "current");
  await symlink(join(import.meta.dirname, ".."), currentPath, process.platform === "win32" ? "junction" : "dir");

  const reservation = net.createServer();
  const port = await listen(reservation);
  await close(reservation);

  const child = spawn(
    process.execPath,
    [join(currentPath, "scripts", "password-gateway.mjs")],
    {
      cwd: currentPath,
      env: {
        ...process.env,
        UIADAPT_GATEWAY_PASSWORD: "symlink-release-password",
        UIADAPT_GATEWAY_PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const output = [];
  child.stdout.on("data", (chunk) => output.push(chunk));
  child.stderr.on("data", (chunk) => output.push(chunk));

  try {
    let unauthorizedResponse;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (child.exitCode !== null) {
        assert.fail(`gateway exited before listening:\n${Buffer.concat(output).toString("utf8")}`);
      }
      try {
        unauthorizedResponse = await globalThis.fetch(`http://127.0.0.1:${port}/uiadapt_demo/`);
        if (unauthorizedResponse.status === 401) break;
      } catch {
        // Listener startup is asynchronous.
      }
      await delay(100);
    }

    assert.equal(unauthorizedResponse?.status, 401);
    assert.equal(child.exitCode, null, Buffer.concat(output).toString("utf8"));

    const authenticatedResponse = await globalThis.fetch(`http://127.0.0.1:${port}/`, {
      headers: {
        authorization: basicAuth("reviewer", "symlink-release-password"),
      },
      redirect: "manual",
    });
    assert.equal(authenticatedResponse.status, 302);
    assert.equal(authenticatedResponse.headers.get("location"), "/uiadapt_demo/");
  } finally {
    if (child.exitCode === null) {
      child.kill();
      await once(child, "exit");
    }
  }

  assert.ok(child.exitCode !== null || child.signalCode !== null);
});

test("rejects missing and incorrect credentials without contacting upstream", async (t) => {
  const { createPasswordGateway } = await loadGateway();
  let upstreamRequests = 0;
  const upstream = http.createServer((_request, response) => {
    upstreamRequests += 1;
    response.end("private application");
  });
  const upstreamPort = await listen(upstream);
  t.after(() => close(upstream));

  const gateway = createPasswordGateway({
    password: "test-only-password-9f4a",
    upstreamUrl: `http://127.0.0.1:${upstreamPort}`,
  });
  const gatewayPort = await listen(gateway);
  t.after(() => close(gateway));

  for (const headers of [
    {},
    { authorization: basicAuth("reviewer", "wrong-password") },
  ]) {
    const response = await globalThis.fetch(`http://127.0.0.1:${gatewayPort}/uiadapt_demo/`, {
      headers,
    });

    assert.equal(response.status, 401);
    assert.equal(
      response.headers.get("www-authenticate"),
      'Basic realm="UIAdapt Demo", charset="UTF-8"',
    );
    assert.equal(response.headers.get("cache-control"), "no-store");
  }

  assert.equal(upstreamRequests, 0);
});

test("redirects an authenticated root request to the nested demo path", async (t) => {
  const { createPasswordGateway } = await loadGateway();
  const gateway = createPasswordGateway({ password: "test-only-password-9f4a" });
  const gatewayPort = await listen(gateway);
  t.after(() => close(gateway));

  const response = await globalThis.fetch(`http://127.0.0.1:${gatewayPort}/`, {
    headers: {
      authorization: basicAuth("reviewer", "test-only-password-9f4a"),
    },
    redirect: "manual",
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/uiadapt_demo/");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("proxies authenticated requests without forwarding the authorization secret", async (t) => {
  const { createPasswordGateway } = await loadGateway();
  const upstream = http.createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      response.writeHead(201, { "content-type": "application/json" });
      response.end(JSON.stringify({
        method: request.method,
        path: request.url,
        authorization: request.headers.authorization ?? null,
        body: Buffer.concat(chunks).toString("utf8"),
      }));
    });
  });
  const upstreamPort = await listen(upstream);
  t.after(() => close(upstream));

  const gateway = createPasswordGateway({
    password: "test-only-password-9f4a",
    upstreamUrl: `http://127.0.0.1:${upstreamPort}`,
  });
  const gatewayPort = await listen(gateway);
  t.after(() => close(gateway));

  const response = await globalThis.fetch(
    `http://127.0.0.1:${gatewayPort}/uiadapt_demo/asset.js?version=1`,
    {
      method: "POST",
      headers: {
        authorization: basicAuth("reviewer", "test-only-password-9f4a"),
        "content-type": "text/plain",
      },
      body: "payload",
    },
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    method: "POST",
    path: "/uiadapt_demo/asset.js?version=1",
    authorization: null,
    body: "payload",
  });
});

test("keeps absolute-form and scheme-relative request targets on the configured upstream", async (t) => {
  const { createPasswordGateway } = await loadGateway();
  const observedPaths = [];
  const upstream = http.createServer((request, response) => {
    observedPaths.push(request.url);
    response.end("fixed upstream");
  });
  const upstreamPort = await listen(upstream);
  t.after(() => close(upstream));

  const gateway = createPasswordGateway({
    password: "test-only-password-9f4a",
    upstreamUrl: `http://127.0.0.1:${upstreamPort}`,
  });
  const gatewayPort = await listen(gateway);
  t.after(() => close(gateway));
  const authorization = basicAuth("reviewer", "test-only-password-9f4a");

  for (const path of [
    "http://127.0.0.1:1/absolute.js?source=external",
    "//127.0.0.1:1/scheme-relative.css?source=external",
  ]) {
    const response = await requestWithRawPath({ authorization, path, port: gatewayPort });
    assert.equal(response.statusCode, 200);
    response.resume();
    await once(response, "end");
  }

  assert.deepEqual(observedPaths, [
    "/absolute.js?source=external",
    "/scheme-relative.css?source=external",
  ]);
});

test("rejects an authenticated malformed HTTP target and remains available", async (t) => {
  const { createPasswordGateway } = await loadGateway();
  let upstreamRequests = 0;
  const upstream = http.createServer((_request, response) => {
    upstreamRequests += 1;
    response.end("fixed upstream");
  });
  const upstreamPort = await listen(upstream);
  t.after(() => close(upstream));

  const gateway = createPasswordGateway({
    password: "test-only-password-9f4a",
    upstreamUrl: `http://127.0.0.1:${upstreamPort}`,
  });
  const gatewayPort = await listen(gateway);
  t.after(() => close(gateway));
  const authorization = basicAuth("reviewer", "test-only-password-9f4a");

  const unauthorizedResponse = await requestWithRawPath({
    authorization: basicAuth("reviewer", "wrong-password"),
    path: "http://[",
    port: gatewayPort,
  });
  assert.equal(unauthorizedResponse.statusCode, 401);
  unauthorizedResponse.resume();
  await once(unauthorizedResponse, "end");

  const malformedResponse = await requestWithRawPath({
    authorization,
    path: "http://[",
    port: gatewayPort,
  });
  assert.equal(malformedResponse.statusCode, 400);
  malformedResponse.resume();
  await once(malformedResponse, "end");

  const healthyResponse = await globalThis.fetch(
    `http://127.0.0.1:${gatewayPort}/uiadapt_demo/`,
    { headers: { authorization } },
  );
  assert.equal(healthyResponse.status, 200);
  assert.equal(await healthyResponse.text(), "fixed upstream");
  assert.equal(upstreamRequests, 1);
});

test("rejects unauthenticated websocket upgrades before contacting upstream", async (t) => {
  const { createPasswordGateway } = await loadGateway();
  let upstreamUpgrades = 0;
  const upstream = http.createServer();
  upstream.on("upgrade", (_request, socket) => {
    upstreamUpgrades += 1;
    socket.destroy();
  });
  const upstreamPort = await listen(upstream);
  t.after(() => close(upstream));

  const gateway = createPasswordGateway({
    password: "test-only-password-9f4a",
    upstreamUrl: `http://127.0.0.1:${upstreamPort}`,
  });
  const gatewayPort = await listen(gateway);
  t.after(() => close(gateway));

  for (const authorization of [
    undefined,
    basicAuth("reviewer", "wrong-password"),
  ]) {
    const response = await upgradeWithRawPath({
      authorization,
      path: "/uiadapt_demo/",
      port: gatewayPort,
    });
    assert.match(response, /^HTTP\/1\.1 401 Unauthorized/m);
    assert.match(response, /WWW-Authenticate: Basic realm="UIAdapt Demo"/i);
  }

  assert.equal(upstreamUpgrades, 0);
});

test("proxies authenticated websocket upgrades to the fixed upstream without authorization", async (t) => {
  const { createPasswordGateway } = await loadGateway();
  const observed = [];
  const upstream = http.createServer();
  upstream.on("upgrade", (request, socket) => {
    observed.push({
      authorization: request.headers.authorization ?? null,
      path: request.url,
    });
    socket.write([
      "HTTP/1.1 101 Switching Protocols",
      "Connection: Upgrade",
      "Upgrade: websocket",
      "",
      "upstream-tunnel",
    ].join("\r\n"));
    socket.end();
  });
  const upstreamPort = await listen(upstream);
  t.after(() => close(upstream));

  const gateway = createPasswordGateway({
    password: "test-only-password-9f4a",
    upstreamUrl: `http://127.0.0.1:${upstreamPort}`,
  });
  const gatewayPort = await listen(gateway);
  t.after(() => close(gateway));

  const response = await upgradeWithRawPath({
    authorization: basicAuth("reviewer", "test-only-password-9f4a"),
    path: "ws://127.0.0.1:1/uiadapt_demo/hmr?token=fixed",
    port: gatewayPort,
  });

  assert.match(response, /^HTTP\/1\.1 101 Switching Protocols/m);
  assert.match(response, /upstream-tunnel/);
  assert.deepEqual(observed, [{
    authorization: null,
    path: "/uiadapt_demo/hmr?token=fixed",
  }]);
});

test("rejects an authenticated malformed websocket target and remains available", async (t) => {
  const { createPasswordGateway } = await loadGateway();
  let upstreamUpgrades = 0;
  const upstream = http.createServer();
  upstream.on("upgrade", (_request, socket) => {
    upstreamUpgrades += 1;
    socket.end([
      "HTTP/1.1 101 Switching Protocols",
      "Connection: Upgrade",
      "Upgrade: websocket",
      "",
      "upstream-tunnel",
    ].join("\r\n"));
  });
  const upstreamPort = await listen(upstream);
  t.after(() => close(upstream));

  const gateway = createPasswordGateway({
    password: "test-only-password-9f4a",
    upstreamUrl: `http://127.0.0.1:${upstreamPort}`,
  });
  const gatewayPort = await listen(gateway);
  t.after(() => close(gateway));
  const authorization = basicAuth("reviewer", "test-only-password-9f4a");

  const unauthorizedResponse = await upgradeWithRawPath({
    authorization: basicAuth("reviewer", "wrong-password"),
    path: "ws://[",
    port: gatewayPort,
  });
  assert.match(unauthorizedResponse, /^HTTP\/1\.1 401 Unauthorized/m);

  const malformedResponse = await upgradeWithRawPath({
    authorization,
    path: "ws://[",
    port: gatewayPort,
  });
  assert.match(malformedResponse, /^HTTP\/1\.1 400 Bad Request/m);

  const healthyResponse = await upgradeWithRawPath({
    authorization,
    path: "/uiadapt_demo/hmr",
    port: gatewayPort,
  });
  assert.match(healthyResponse, /^HTTP\/1\.1 101 Switching Protocols/m);
  assert.match(healthyResponse, /upstream-tunnel/);
  assert.equal(upstreamUpgrades, 1);
});

test("routes authenticated API prefixes to fixed 4181 upstream and preserves static routing", async (t) => {
  const { createPasswordGateway } = await loadGateway();
  const staticPaths = [];
  const apiRequests = [];
  const staticUpstream = http.createServer((request, response) => {
    staticPaths.push(request.url);
    response.end("static-upstream");
  });
  const apiUpstream = http.createServer((request, response) => {
    apiRequests.push({ path: request.url, authorization: request.headers.authorization ?? null });
    response.end("api-upstream");
  });
  const staticPort = await listen(staticUpstream);
  const apiPort = await listen(apiUpstream);
  t.after(() => close(staticUpstream));
  t.after(() => close(apiUpstream));

  const gateway = createPasswordGateway({
    password: "test-only-password-9f4a",
    upstreamUrl: `http://127.0.0.1:${staticPort}`,
    apiUpstreamUrl: `http://127.0.0.1:${apiPort}`,
  });
  const gatewayPort = await listen(gateway);
  t.after(() => close(gateway));
  const authorization = basicAuth("reviewer", "test-only-password-9f4a");

  const apiResponse = await globalThis.fetch(`http://127.0.0.1:${gatewayPort}/api/uiadapt/health`, {
    headers: { authorization },
  });
  assert.equal(apiResponse.status, 200);
  assert.equal(await apiResponse.text(), "api-upstream");

  const staticResponse = await globalThis.fetch(`http://127.0.0.1:${gatewayPort}/uiadapt_demo/`, {
    headers: { authorization },
  });
  assert.equal(staticResponse.status, 200);
  assert.equal(await staticResponse.text(), "static-upstream");

  const absoluteApiResponse = await requestWithRawPath({
    authorization,
    path: "http://127.0.0.1:1/api/uiadapt/trajectory?source=external",
    port: gatewayPort,
  });
  assert.equal(absoluteApiResponse.statusCode, 200);
  absoluteApiResponse.resume();
  await once(absoluteApiResponse, "end");

  const unauthenticatedApiResponse = await globalThis.fetch(`http://127.0.0.1:${gatewayPort}/api/uiadapt/health`);
  assert.equal(unauthenticatedApiResponse.status, 401);
  assert.equal(apiRequests.length, 2);
  assert.deepEqual(apiRequests.map(({ path, authorization: forwarded }) => ({ path, authorization: forwarded })), [
    { path: "/api/uiadapt/health", authorization: null },
    { path: "/api/uiadapt/trajectory?source=external", authorization: null },
  ]);
  assert.deepEqual(staticPaths, ["/uiadapt_demo/"]);
});
