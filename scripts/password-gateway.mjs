import { Buffer } from "node:buffer";
import console from "node:console";
import { createHash, timingSafeEqual } from "node:crypto";
import http from "node:http";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL, URL } from "node:url";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4180;
const DEFAULT_UPSTREAM = "http://127.0.0.1:5173";
const DEFAULT_USERNAME = "reviewer";

function constantTimeEqual(actual, expected) {
  const actualDigest = createHash("sha256").update(actual).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualDigest, expectedDigest);
}

function hasValidCredentials(authorization, username, password) {
  const [scheme = "", encoded = ""] = authorization?.split(/\s+/, 2) ?? [];
  let suppliedUsername = "";
  let suppliedPassword = "";

  if (scheme.toLowerCase() === "basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator >= 0) {
      suppliedUsername = decoded.slice(0, separator);
      suppliedPassword = decoded.slice(separator + 1);
    }
  }

  const usernameMatches = constantTimeEqual(suppliedUsername, username);
  const passwordMatches = constantTimeEqual(suppliedPassword, password);
  return usernameMatches && passwordMatches;
}

function rejectUnauthorized(response) {
  response.writeHead(401, {
    "WWW-Authenticate": 'Basic realm="UIAdapt Demo", charset="UTF-8"',
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end("Authentication required");
}

function upstreamTarget(requestUrl, upstream) {
  const incoming = new URL(requestUrl ?? "/", "http://gateway.invalid");
  return new URL(`${incoming.pathname}${incoming.search}`, upstream);
}

function proxyRequest(request, response, upstream) {
  const target = upstreamTarget(request.url, upstream);
  const headers = { ...request.headers, host: target.host };
  delete headers.authorization;

  const upstreamRequest = http.request(target, {
    method: request.method,
    headers,
  }, (upstreamResponse) => {
    response.writeHead(
      upstreamResponse.statusCode ?? 502,
      upstreamResponse.headers,
    );
    upstreamResponse.pipe(response);
  });

  upstreamRequest.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(502, {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      });
    }
    response.end("Upstream unavailable");
  });

  request.pipe(upstreamRequest);
}

function rejectUnauthorizedUpgrade(socket) {
  const body = "Authentication required";
  socket.end([
    "HTTP/1.1 401 Unauthorized",
    'WWW-Authenticate: Basic realm="UIAdapt Demo", charset="UTF-8"',
    "Cache-Control: no-store",
    "Connection: close",
    "Content-Type: text/plain; charset=utf-8",
    `Content-Length: ${Buffer.byteLength(body)}`,
    "",
    body,
  ].join("\r\n"));
}

function proxyUpgrade(request, clientSocket, clientHead, upstream) {
  const target = upstreamTarget(request.url, upstream);
  const headers = { ...request.headers, host: target.host };
  delete headers.authorization;

  const upstreamRequest = http.request(target, {
    method: request.method,
    headers,
  });

  upstreamRequest.on("upgrade", (response, upstreamSocket, upstreamHead) => {
    const responseHeaders = [];
    for (let index = 0; index < response.rawHeaders.length; index += 2) {
      responseHeaders.push(`${response.rawHeaders[index]}: ${response.rawHeaders[index + 1]}`);
    }
    clientSocket.write([
      `HTTP/1.1 ${response.statusCode} ${response.statusMessage}`,
      ...responseHeaders,
      "",
      "",
    ].join("\r\n"));
    if (upstreamHead.length) clientSocket.write(upstreamHead);
    if (clientHead.length) upstreamSocket.write(clientHead);
    upstreamSocket.pipe(clientSocket).pipe(upstreamSocket);
  });

  upstreamRequest.on("response", (response) => {
    clientSocket.write([
      `HTTP/1.1 ${response.statusCode ?? 502} ${response.statusMessage ?? "Bad Gateway"}`,
      "Connection: close",
      "",
      "",
    ].join("\r\n"));
    response.pipe(clientSocket);
  });

  upstreamRequest.on("error", () => {
    clientSocket.end([
      "HTTP/1.1 502 Bad Gateway",
      "Cache-Control: no-store",
      "Connection: close",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "Upstream unavailable",
    ].join("\r\n"));
  });

  upstreamRequest.end();
}

export function createPasswordGateway({
  password,
  username = DEFAULT_USERNAME,
  upstreamUrl = DEFAULT_UPSTREAM,
} = {}) {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("UIADAPT_GATEWAY_PASSWORD is required");
  }

  const upstream = new URL(upstreamUrl);
  if (upstream.protocol !== "http:") {
    throw new Error("UIAdapt gateway upstream must use http://");
  }

  const gateway = http.createServer((request, response) => {
    if (!hasValidCredentials(request.headers.authorization, username, password)) {
      rejectUnauthorized(response);
      return;
    }

    if (request.url === "/") {
      response.writeHead(302, {
        "Cache-Control": "no-store",
        Location: "/uiadapt_demo/",
      });
      response.end();
      return;
    }

    proxyRequest(request, response, upstream);
  });

  gateway.on("upgrade", (request, socket, head) => {
    if (!hasValidCredentials(request.headers.authorization, username, password)) {
      rejectUnauthorizedUpgrade(socket);
      return;
    }

    proxyUpgrade(request, socket, head, upstream);
  });

  return gateway;
}

function readPort(value) {
  const port = Number(value ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("UIADAPT_GATEWAY_PORT must be an integer from 1 to 65535");
  }
  return port;
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : "";
const isDirectExecution = entryPath
  && pathToFileURL(entryPath).href === import.meta.url;

if (isDirectExecution) {
  const port = readPort(process.env.UIADAPT_GATEWAY_PORT);
  const gateway = createPasswordGateway({
    password: process.env.UIADAPT_GATEWAY_PASSWORD,
    username: process.env.UIADAPT_GATEWAY_USER ?? DEFAULT_USERNAME,
    upstreamUrl: process.env.UIADAPT_GATEWAY_UPSTREAM ?? DEFAULT_UPSTREAM,
  });

  gateway.listen(port, DEFAULT_HOST, () => {
    console.log(`UIAdapt password gateway listening on http://${DEFAULT_HOST}:${port}`);
  });
}
