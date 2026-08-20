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

function proxyRequest(request, response, upstreamUrl) {
  const target = new URL(request.url ?? "/", upstreamUrl);
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

  return http.createServer((request, response) => {
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
