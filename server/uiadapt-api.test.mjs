import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { createUiAdaptHandler, resolveApiHost } from "./uiadapt-api.mjs";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const FORGED_SESSION_ID = "22222222-2222-4222-8222-222222222222";

function session(overrides = {}) {
  return {
    sessionId: SESSION_ID,
    startedAtMs: 1_000,
    source: "REPLAY",
    adaptiveEnabled: true,
    ...overrides,
  };
}

function frame(overrides = {}) {
  return {
    sessionId: SESSION_ID,
    sequenceNo: 1,
    event: {
      id: "event-1",
      atMs: 500,
      type: "VIEW_PRODUCT",
      productId: "aurora-one",
      source: "REPLAY",
    },
    behaviorDimension: "BROWSE",
    snapshot: {
      eventCount: 1,
      windowSize: 1,
      counts: { BROWSE: 1, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 },
      current: { BROWSE: 1, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 },
      reference: { BROWSE: 0.5, DETAIL: 0.2, COMPARE: 0.15, DECISION: 0.1, CART_INTENT: 0.05 },
      changeScore: 0.5,
      candidateState: "EXPLORE",
      candidatePersistence: 0,
      detectedState: "EXPLORE",
      appliedState: "EXPLORE",
      adaptiveEnabled: true,
    },
    transition: null,
    ...overrides,
  };
}

function conflict() {
  const error = new Error("CONFLICT");
  error.code = "CONFLICT";
  return error;
}

function createFakeDb() {
  const sessions = new Map();
  const trajectories = new Map();
  return {
    healthy: true,
    async health() {
      if (!this.healthy) throw new Error("DB_UNAVAILABLE");
    },
    async createSession(payload) {
      const existing = sessions.get(payload.sessionId);
      if (!existing) {
        sessions.set(payload.sessionId, payload);
        return { created: true };
      }
      if (JSON.stringify(existing) !== JSON.stringify(payload)) throw conflict();
      return { created: false };
    },
    async appendTrajectory(payload) {
      const key = `${payload.sessionId}:${payload.sequenceNo}`;
      const existing = trajectories.get(key);
      if (existing) {
        if (JSON.stringify(existing) !== JSON.stringify(payload)) throw conflict();
        return { duplicate: true };
      }
      trajectories.set(key, payload);
      return { duplicate: false };
    },
    async getTrajectory(sessionId) {
      return [...trajectories.values()]
        .filter((item) => item.sessionId === sessionId)
        .sort((a, b) => a.sequenceNo - b.sequenceNo);
    },
  };
}

let server;
let origin;
let db;

before(async () => {
  db = createFakeDb();
  server = createServer(createUiAdaptHandler({ db }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  origin = `http://127.0.0.1:${address.port}`;
});

after(() => server.close());

test("fails closed when the API host is not loopback", () => {
  assert.equal(resolveApiHost({}), "127.0.0.1");
  assert.throws(() => resolveApiHost({ UIADAPT_API_HOST: "0.0.0.0" }), { message: "UIADAPT_API_LOOPBACK_ONLY" });
});

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const response = await globalThis.fetch(`${origin}${path}`, {
    method,
    headers: body === undefined ? headers : { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test("returns health and fails closed at the API boundary when DB is unavailable", async () => {
  assert.deepEqual(await request("/api/uiadapt/health"), { status: 200, body: { status: "ok" } });
  db.healthy = false;
  assert.deepEqual(await request("/api/uiadapt/health"), { status: 503, body: { status: "unhealthy" } });
  db.healthy = true;
});

test("returns 400 for malformed JSON and wrong content type", async () => {
  assert.equal((await request("/api/uiadapt/sessions", { method: "POST", body: "{" })).status, 400);
  assert.equal((await request("/api/uiadapt/sessions", {
    method: "POST",
    body: JSON.stringify(session()),
    headers: { "Content-Type": "text/plain" },
  })).status, 400);
});

test("returns 413 for an oversized body", async () => {
  const response = await request("/api/uiadapt/sessions", {
    method: "POST",
    body: JSON.stringify({ ...session(), padding: "x".repeat(70_000) }),
  });
  assert.equal(response.status, 413);
});

test("returns 400 for malformed UUID, sequence, and score and 422 for semantic enums", async () => {
  assert.equal((await request("/api/uiadapt/sessions", { method: "POST", body: session({ sessionId: "bad" }) })).status, 400);
  assert.equal((await request("/api/uiadapt/trajectory", { method: "POST", body: frame({ sequenceNo: 0 }) })).status, 400);
  assert.equal((await request("/api/uiadapt/trajectory", {
    method: "POST",
    body: frame({ snapshot: { ...frame().snapshot, changeScore: 2 } }),
  })).status, 400);
  assert.equal((await request("/api/uiadapt/trajectory", {
    method: "POST",
    body: frame({ event: { ...frame().event, type: "NOT_AN_EVENT" } }),
  })).status, 422);
});

test("rejects a trajectory whose event, sequence, window, and distribution disagree", async () => {
  await request("/api/uiadapt/sessions", { method: "POST", body: session({ sessionId: FORGED_SESSION_ID }) });
  const forged = frame({
    sessionId: FORGED_SESSION_ID,
    sequenceNo: 2,
    behaviorDimension: "DETAIL",
    event: { ...frame().event, id: "forged-trajectory" },
    snapshot: {
      ...frame().snapshot,
      eventCount: 999,
      windowSize: 20,
      counts: { BROWSE: 0, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 },
    },
  });
  assert.deepEqual(
    await request("/api/uiadapt/trajectory", { method: "POST", body: forged }),
    { status: 422, body: { error: "TRAJECTORY_INCONSISTENT" } },
  );
});

test("creates sessions idempotently and rejects conflicting metadata", async () => {
  assert.equal((await request("/api/uiadapt/sessions", { method: "POST", body: session() })).status, 201);
  assert.equal((await request("/api/uiadapt/sessions", { method: "POST", body: session() })).status, 200);
  assert.equal((await request("/api/uiadapt/sessions", {
    method: "POST",
    body: session({ adaptiveEnabled: false }),
  })).status, 409);
});

test("accepts a trajectory, makes exact retry idempotent, and rejects conflict", async () => {
  assert.equal((await request("/api/uiadapt/trajectory", { method: "POST", body: frame() })).status, 201);
  assert.equal((await request("/api/uiadapt/trajectory", { method: "POST", body: frame() })).status, 200);
  assert.equal((await request("/api/uiadapt/trajectory", {
    method: "POST",
    body: frame({ event: { ...frame().event, atMs: 600 } }),
  })).status, 409);
});

test("returns an ordered, secret-free trajectory", async () => {
  const response = await request(`/api/uiadapt/sessions/${SESSION_ID}/trajectory`);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.trajectory.map((item) => item.sequenceNo), [1]);
  assert.equal(JSON.stringify(response.body).includes("password"), false);
});
