import assert from "node:assert/strict";
import { test } from "node:test";
import { createDbAdapter, createMysqlPool } from "./db.mjs";
import {
  assertTrajectoryConsistency,
  assertTrajectoryContinuity,
  assertTrajectoryPolicy,
} from "./validation.mjs";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

function frame() {
  return {
    sessionId: SESSION_ID,
    sequenceNo: 1,
    event: { id: "event-1", atMs: 500, type: "VIEW_PRODUCT", productId: "aurora-one", source: "REPLAY" },
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
    },
    transition: null,
  };
}

test("fails closed when no MySQL credential source exists", () => {
  assert.throws(() => createMysqlPool({}), { message: "MYSQL_CREDENTIAL_MISSING" });
});

test("rolls back a correlated trajectory when snapshot insertion fails", async () => {
  const calls = [];
  const connection = {
    async beginTransaction() { calls.push("begin"); },
    async commit() { calls.push("commit"); },
    async rollback() { calls.push("rollback"); },
    release() { calls.push("release"); },
    async execute(query, params) {
      calls.push({ query, params });
      if (query.includes("FROM uiadapt_sessions WHERE session_id = ? FOR UPDATE")) {
        return [[{ session_id: SESSION_ID, event_source: "REPLAY" }], []];
      }
      if (query.includes("FROM uiadapt_events")) return [[], []];
      if (query.includes("INSERT INTO uiadapt_events")) return [{ affectedRows: 1 }, []];
      if (query.includes("INSERT INTO uiadapt_distribution_snapshots")) throw new Error("SNAPSHOT_INSERT_FAILED");
      throw new Error(`UNEXPECTED_QUERY:${query}`);
    },
  };
  const pool = { async getConnection() { return connection; } };
  const db = createDbAdapter(pool);

  await assert.rejects(() => db.appendTrajectory(frame()), { message: "SNAPSHOT_INSERT_FAILED" });
  assert.deepEqual(calls.filter((call) => typeof call === "string"), ["begin", "rollback", "release"]);
  const sqlCalls = calls.filter((call) => typeof call === "object");
  assert.equal(sqlCalls.every(({ query }) => !query.includes("'event-1'") && query.includes("?")), true);
});

test("treats a retry as duplicate after MySQL DECIMAL storage rounds telemetry floats", async () => {
  const reference = { BROWSE: 0.5, DETAIL: 0.2, COMPARE: 0.15, DECISION: 0.1, CART_INTENT: 0.05 };
  const steps = [
    { type: "VIEW_PRODUCT", dimension: "BROWSE" },
    { type: "OPEN_DETAILS", dimension: "DETAIL" },
    { type: "ADD_COMPARE", dimension: "COMPARE" },
    { type: "CHECK_PRICE", dimension: "DECISION" },
    { type: "CHECK_REVIEWS", dimension: "DECISION" },
  ];
  const rounded = (value) => Number(value.toFixed(10));
  const frameAt = (sequenceNo) => {
    const counts = { BROWSE: 0, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 };
    for (const step of steps.slice(0, sequenceNo)) counts[step.dimension] += 1;
    const current = Object.fromEntries(Object.keys(counts).map((dimension) => [dimension, counts[dimension] / sequenceNo]));
    const changeScore = Math.min(
      1,
      Object.keys(reference).reduce((sum, dimension) => sum + Math.abs(current[dimension] - reference[dimension]), 0) / 2,
    );
    return {
      ...frame(),
      sequenceNo,
      event: {
        ...frame().event,
        id: `event-${sequenceNo}`,
        atMs: sequenceNo * 500,
        type: steps[sequenceNo - 1].type,
      },
      behaviorDimension: steps[sequenceNo - 1].dimension,
      snapshot: {
        ...frame().snapshot,
        eventCount: sequenceNo,
        windowSize: sequenceNo,
        counts,
        current,
        changeScore,
      },
    };
  };

  const events = new Map();
  const snapshots = new Map();
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async execute(query, params) {
      if (query.includes("FROM uiadapt_sessions WHERE session_id = ? FOR UPDATE")) {
        return [[{ session_id: SESSION_ID, event_source: "REPLAY" }], []];
      }
      if (query.includes("SELECT sequence_no, at_ms")) {
        const previous = [...events.values()].at(-1);
        return [previous ? [{ sequence_no: previous.sequence_no, at_ms: previous.at_ms }] : [], []];
      }
      if (query.includes("FROM uiadapt_events")) {
        const [sessionId, sequenceNo, eventId] = params;
        const row = events.get(`${sessionId}:${sequenceNo}`)
          ?? [...events.values()].find((candidate) => candidate.event_id === eventId);
        return [row ? [row] : [], []];
      }
      if (query.includes("FROM uiadapt_distribution_snapshots")) {
        const row = snapshots.get(`${params[0]}:${params[1]}`);
        return [row ? [row] : [], []];
      }
      if (query.includes("FROM uiadapt_transitions")) return [[], []];
      if (query.includes("INSERT INTO uiadapt_events")) {
        const [sessionId, sequenceNo, eventId, atMs, type, productId, source, behaviorDimension] = params;
        events.set(`${sessionId}:${sequenceNo}`, {
          session_id: sessionId,
          sequence_no: sequenceNo,
          event_id: eventId,
          at_ms: atMs,
          raw_event_type: type,
          product_id: productId,
          event_source: source,
          behavior_dimension: behaviorDimension,
        });
        return [{ affectedRows: 1 }, []];
      }
      if (query.includes("INSERT INTO uiadapt_distribution_snapshots")) {
        const [sessionId, sequenceNo, eventCount, windowSize, browseCount, detailCount, compareCount,
          decisionCount, cartIntentCount, currentBrowse, currentDetail, currentCompare, currentDecision,
          currentCartIntent, referenceBrowse, referenceDetail, referenceCompare, referenceDecision,
          referenceCartIntent, changeScore, candidateState, candidatePersistence, detectedState, appliedState] = params;
        snapshots.set(`${sessionId}:${sequenceNo}`, {
          event_count: eventCount,
          window_size: windowSize,
          browse_count: browseCount,
          detail_count: detailCount,
          compare_count: compareCount,
          decision_count: decisionCount,
          cart_intent_count: cartIntentCount,
          current_browse: rounded(currentBrowse),
          current_detail: rounded(currentDetail),
          current_compare: rounded(currentCompare),
          current_decision: rounded(currentDecision),
          current_cart_intent: rounded(currentCartIntent),
          reference_browse: rounded(referenceBrowse),
          reference_detail: rounded(referenceDetail),
          reference_compare: rounded(referenceCompare),
          reference_decision: rounded(referenceDecision),
          reference_cart_intent: rounded(referenceCartIntent),
          change_score: rounded(changeScore),
          candidate_state: candidateState,
          candidate_persistence: candidatePersistence,
          detected_state: detectedState,
          applied_state: appliedState,
        });
        return [{ affectedRows: 1 }, []];
      }
      throw new Error(`UNEXPECTED_QUERY:${query}`);
    },
  };
  const db = createDbAdapter({ async getConnection() { return connection; } });

  assert.deepEqual(await db.appendTrajectory(frameAt(1)), { duplicate: false });
  assert.deepEqual(await db.appendTrajectory(frameAt(2)), { duplicate: false });
  assert.deepEqual(await db.appendTrajectory(frameAt(3)), { duplicate: false });
  assert.deepEqual(await db.appendTrajectory(frameAt(3)), { duplicate: true });

  await assert.rejects(
    () => db.appendTrajectory({
      ...frameAt(4),
      event: { ...frameAt(4).event, id: "event-source-mismatch", source: "USER" },
    }),
    (error) => error.code === "TRAJECTORY_INCONSISTENT",
  );
  await assert.rejects(
    () => db.appendTrajectory({
      ...frameAt(5),
      event: { ...frameAt(5).event, id: "event-sequence-gap" },
    }),
    (error) => error.code === "TRAJECTORY_INCONSISTENT",
  );
});

test("rejects a forged transition before minimum evidence and before writing", async () => {
  const payload = {
    ...frame(),
    snapshot: {
      ...frame().snapshot,
      candidateState: "PURCHASE_INTENT",
      candidatePersistence: 3,
      detectedState: "PURCHASE_INTENT",
      appliedState: "PURCHASE_INTENT",
    },
    transition: {
      sequenceNo: 1,
      fromState: "EXPLORE",
      toState: "PURCHASE_INTENT",
      changeScore: 0.5,
      persistenceCount: 3,
    },
  };
  const queries = [];
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async execute(query) {
      queries.push(query);
      if (query.includes("FROM uiadapt_sessions WHERE session_id = ? FOR UPDATE")) {
        return [[{ session_id: SESSION_ID, event_source: "REPLAY" }], []];
      }
      if (query.includes("FROM uiadapt_events")) return [[], []];
      if (query.includes("INSERT INTO")) return [{ affectedRows: 1 }, []];
      throw new Error(`UNEXPECTED_QUERY:${query}`);
    },
  };
  const db = createDbAdapter({ async getConnection() { return connection; } });

  await assert.rejects(
    () => db.appendTrajectory(payload),
    (error) => error.code === "TRAJECTORY_INCONSISTENT",
  );
  assert.equal(queries.some((query) => query.includes("INSERT INTO")), false);
});

test("accepts a transition with the required preceding persistence frame", () => {
  const payload = {
    ...frame(),
    sequenceNo: 15,
    snapshot: {
      ...frame().snapshot,
      eventCount: 15,
      candidateState: "COMPARE",
      candidatePersistence: 3,
      detectedState: "COMPARE",
      appliedState: "COMPARE",
    },
    transition: {
      sequenceNo: 15,
      fromState: "EXPLORE",
      toState: "COMPARE",
      changeScore: 0.5,
      persistenceCount: 3,
    },
  };

  assert.doesNotThrow(() => assertTrajectoryContinuity(payload, {
    sequence_no: 14,
    detected_state: "EXPLORE",
    candidate_state: "COMPARE",
    candidate_persistence: 2,
  }));
});

test("rejects a non-transition snapshot with impossible persistence", () => {
  const payload = {
    ...frame(),
    snapshot: {
      ...frame().snapshot,
      candidateState: "PURCHASE_INTENT",
      candidatePersistence: 3,
      detectedState: "PURCHASE_INTENT",
      appliedState: "PURCHASE_INTENT",
    },
  };

  assert.throws(
    () => assertTrajectoryConsistency(payload),
    (error) => error.code === "TRAJECTORY_INCONSISTENT",
  );
});

test("accepts an ineligible candidate with no pending persistence", () => {
  const payload = {
    ...frame(),
    snapshot: {
      ...frame().snapshot,
      candidateState: "COMPARE",
      candidatePersistence: 0,
      detectedState: "EXPLORE",
      appliedState: "EXPLORE",
    },
  };

  assert.doesNotThrow(() => assertTrajectoryConsistency(payload));
});

test("enforces the applied state for the session Adaptive policy", () => {
  const payload = {
    ...frame(),
    snapshot: {
      ...frame().snapshot,
      detectedState: "COMPARE",
      appliedState: "PURCHASE_INTENT",
    },
  };

  assert.throws(
    () => assertTrajectoryPolicy(payload, true),
    (error) => error.code === "TRAJECTORY_INCONSISTENT",
  );
  assert.doesNotThrow(() => assertTrajectoryPolicy({
    ...payload,
    snapshot: { ...payload.snapshot, appliedState: "EXPLORE" },
  }, false));
});
