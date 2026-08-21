import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { URL } from "node:url";

const schema = readFileSync(new URL("../db/001-uiadapt-demo.sql", import.meta.url), "utf8");
const tables = [
  "uiadapt_sessions",
  "uiadapt_events",
  "uiadapt_distribution_snapshots",
  "uiadapt_transitions",
];

test("defines exactly four InnoDB utf8mb4 telemetry tables without server-side decision logic", () => {
  assert.equal((schema.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length, 4);
  for (const table of tables) assert.match(schema, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.equal((schema.match(/ENGINE=InnoDB/g) ?? []).length, 4);
  assert.equal((schema.match(/utf8mb4/g) ?? []).length >= 4, true);
  assert.doesNotMatch(schema, /CREATE\s+(TRIGGER|PROCEDURE|FUNCTION|EVENT)/i);
  assert.doesNotMatch(schema, /stored\s+procedure|normalized\s+l1|change_score\s*=|candidate_state\s*=/i);
  assert.match(schema, /UNIQUE KEY uq_uiadapt_event_identity/);
  assert.match(schema, /FOREIGN KEY \(session_id, trigger_sequence_no\)/);
  assert.doesNotMatch(schema, /ip_address|user_agent|email|password/i);
});
