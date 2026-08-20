import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { once } from "node:events";
import http from "node:http";
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
