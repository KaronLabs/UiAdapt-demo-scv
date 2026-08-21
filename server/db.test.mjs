import assert from "node:assert/strict";
import { test } from "node:test";
import { createDbAdapter, createMysqlPool } from "./db.mjs";

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
      if (query.includes("SELECT session_id FROM uiadapt_sessions")) return [[{ session_id: SESSION_ID }], []];
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
