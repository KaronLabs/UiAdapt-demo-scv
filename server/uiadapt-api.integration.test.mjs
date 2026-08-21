import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { after, before, test } from "node:test";
import { createDatabaseFromEnv } from "./db.mjs";

const enabled = process.env.UIADAPT_INTEGRATION === "1";
let pool;
let db;
let sessionId;

function frame(sequenceNo, eventId = `event-${sequenceNo}`) {
  return {
    sessionId,
    sequenceNo,
    event: { id: eventId, atMs: sequenceNo * 500, type: "VIEW_PRODUCT", productId: "aurora-one", source: "REPLAY" },
    behaviorDimension: "BROWSE",
    snapshot: {
      eventCount: sequenceNo,
      windowSize: sequenceNo,
      counts: { BROWSE: sequenceNo, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 },
      current: { BROWSE: 1, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 },
      reference: { BROWSE: 0.5, DETAIL: 0.2, COMPARE: 0.15, DECISION: 0.1, CART_INTENT: 0.05 },
      changeScore: 0.5,
      candidateState: "EXPLORE",
      candidatePersistence: 0,
      detectedState: "EXPLORE",
      appliedState: "EXPLORE",
    },
    transition: null,
  };
}

if (enabled) {
  before(async () => {
    ({ pool, db } = createDatabaseFromEnv());
    sessionId = randomUUID();
    await db.health();
    await db.createSession({ sessionId, startedAtMs: Date.now(), source: "REPLAY", adaptiveEnabled: true });
  });

  after(async () => {
    await pool.end();
  });

  test("persists ordered trajectory and exact duplicate retry without duplicate rows", async () => {
    const first = frame(1);
    const second = frame(2);
    assert.deepEqual(await db.appendTrajectory(first), { duplicate: false });
    assert.deepEqual(await db.appendTrajectory(first), { duplicate: true });
    assert.deepEqual(await db.appendTrajectory(second), { duplicate: false });
    const trajectory = await db.getTrajectory(sessionId);
    assert.deepEqual(trajectory.map((item) => item.sequenceNo), [1, 2]);
  });

  test("rejects conflicting duplicate identity", async () => {
    await assert.rejects(
      () => db.appendTrajectory(frame(1, "event-conflict")),
      (error) => error.code === "CONFLICT",
    );
  });
} else {
  test("MySQL integration is unavailable without disposable CI configuration", { skip: "UIADAPT_INTEGRATION is not 1" }, () => {});
}
