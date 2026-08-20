import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { once } from "node:events";
import http from "node:http";
import net from "node:net";
import test from "node:test";

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
