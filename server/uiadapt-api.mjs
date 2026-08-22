import { createServer } from "node:http";
import { realpathSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { URL } from "node:url";
import { createDatabaseFromEnv } from "./db.mjs";
import {
  ApiError,
  readJsonBody,
  validateSession,
  validateSessionId,
  validateTrajectory,
} from "./validation.mjs";

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function routeError(error) {
  if (error instanceof ApiError) return error;
  if (error?.code === "CONFLICT") return new ApiError(409, "CONFLICT");
  if (error?.code === "NOT_FOUND") return new ApiError(404, "NOT_FOUND");
  if (error?.code === "TRAJECTORY_INCONSISTENT") return new ApiError(422, "TRAJECTORY_INCONSISTENT");
  return new ApiError(500, "INTERNAL_ERROR");
}

export function resolveApiHost(env = process.env) {
  const host = env.UIADAPT_API_HOST ?? "127.0.0.1";
  if (host !== "127.0.0.1") throw new Error("UIADAPT_API_LOOPBACK_ONLY");
  return host;
}

export function isDirectExecution(entryPath, modulePath) {
  try {
    return Boolean(entryPath) && realpathSync(entryPath) === realpathSync(modulePath);
  } catch {
    return false;
  }
}

function matchTrajectoryPath(pathname) {
  const match = /^\/api\/uiadapt\/sessions\/([^/]+)\/trajectory$/.exec(pathname);
  return match?.[1] ?? null;
}

export function createUiAdaptHandler({ db }) {
  if (!db) throw new Error("DB_ADAPTER_REQUIRED");
  return async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/api/uiadapt/health") {
        try {
          await db.health();
          sendJson(response, 200, { status: "ok" });
        } catch {
          sendJson(response, 503, { status: "unhealthy" });
        }
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/uiadapt/sessions") {
        const payload = validateSession(await readJsonBody(request));
        const result = await db.createSession(payload);
        sendJson(response, result.created ? 201 : 200, {
          status: result.created ? "created" : "duplicate",
          sessionId: payload.sessionId,
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/uiadapt/trajectory") {
        const payload = validateTrajectory(await readJsonBody(request));
        const result = await db.appendTrajectory(payload);
        sendJson(response, result.duplicate ? 200 : 201, {
          status: result.duplicate ? "duplicate" : "recorded",
          sessionId: payload.sessionId,
          sequenceNo: payload.sequenceNo,
        });
        return;
      }

      if (request.method === "GET") {
        const sessionId = matchTrajectoryPath(url.pathname);
        if (sessionId !== null) {
          const trajectory = await db.getTrajectory(validateSessionId(sessionId));
          sendJson(response, 200, { sessionId, trajectory });
          return;
        }
      }

      throw new ApiError(404, "NOT_FOUND");
    } catch (error) {
      const normalized = routeError(error);
      sendJson(response, normalized.status, { error: normalized.code });
    }
  };
}

export function createUiAdaptServer(options) {
  return createServer(createUiAdaptHandler(options));
}

if (isDirectExecution(process.argv[1], fileURLToPath(import.meta.url))) {
  const { pool, db } = createDatabaseFromEnv();
  const server = createUiAdaptServer({ db });
  const host = resolveApiHost();
  const port = Number(process.env.UIADAPT_API_PORT ?? 4181);
  server.listen(port, host);
  const shutdown = async () => {
    server.close();
    await pool.end();
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
