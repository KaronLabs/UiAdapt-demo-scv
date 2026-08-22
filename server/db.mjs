import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";
import {
  assertTrajectoryConsistency,
  assertTrajectoryContinuity,
  assertTrajectoryPolicy,
  canonicalizeTrajectory,
} from "./validation.mjs";

const SESSION_COLUMNS = "session_id, started_at_ms, event_source, adaptive_enabled";

function conflict() {
  const error = new Error("CONFLICT");
  error.code = "CONFLICT";
  return error;
}

function notFound() {
  const error = new Error("NOT_FOUND");
  error.code = "NOT_FOUND";
  return error;
}

function inconsistentTrajectory() {
  const error = new Error("TRAJECTORY_INCONSISTENT");
  error.code = "TRAJECTORY_INCONSISTENT";
  return error;
}

function readMysqlPassword(env) {
  const credentialPath = env.UIADAPT_MYSQL_PASSWORD_FILE
    ?? (env.CREDENTIALS_DIRECTORY ? join(env.CREDENTIALS_DIRECTORY, "mysql-password") : null);
  const password = credentialPath
    ? readFileSync(credentialPath, "utf8").trim()
    : String(env.UIADAPT_MYSQL_PASSWORD ?? "").trim();
  if (!password) throw new Error("MYSQL_CREDENTIAL_MISSING");
  return password;
}

export function createMysqlPool(env = process.env) {
  return mysql.createPool({
    host: "127.0.0.1",
    port: Number(env.UIADAPT_DB_PORT ?? 3306),
    user: env.UIADAPT_DB_USER ?? "uiadapt_demo_app",
    password: readMysqlPassword(env),
    database: "uiadapt_demo",
    charset: "utf8mb4",
    decimalNumbers: true,
    waitForConnections: true,
    connectionLimit: 4,
    maxIdle: 4,
    queueLimit: 128,
  });
}

async function withTransaction(pool, callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Preserve the original transaction failure.
    }
    throw error;
  } finally {
    connection.release();
  }
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameTrajectory(left, right) {
  return sameJson(canonicalizeTrajectory(left), canonicalizeTrajectory(right));
}

function frameFromRows(event, snapshot, transition) {
  return {
    sessionId: event.session_id,
    sequenceNo: Number(event.sequence_no),
    event: {
      id: event.event_id,
      atMs: Number(event.at_ms),
      type: event.raw_event_type,
      productId: event.product_id,
      source: event.event_source,
    },
    behaviorDimension: event.behavior_dimension,
    snapshot: {
      eventCount: Number(snapshot.event_count),
      windowSize: Number(snapshot.window_size),
      counts: {
        BROWSE: Number(snapshot.browse_count),
        DETAIL: Number(snapshot.detail_count),
        COMPARE: Number(snapshot.compare_count),
        DECISION: Number(snapshot.decision_count),
        CART_INTENT: Number(snapshot.cart_intent_count),
      },
      current: {
        BROWSE: Number(snapshot.current_browse),
        DETAIL: Number(snapshot.current_detail),
        COMPARE: Number(snapshot.current_compare),
        DECISION: Number(snapshot.current_decision),
        CART_INTENT: Number(snapshot.current_cart_intent),
      },
      reference: {
        BROWSE: Number(snapshot.reference_browse),
        DETAIL: Number(snapshot.reference_detail),
        COMPARE: Number(snapshot.reference_compare),
        DECISION: Number(snapshot.reference_decision),
        CART_INTENT: Number(snapshot.reference_cart_intent),
      },
      changeScore: Number(snapshot.change_score),
      candidateState: snapshot.candidate_state,
      candidatePersistence: Number(snapshot.candidate_persistence),
      detectedState: snapshot.detected_state,
      appliedState: snapshot.applied_state,
    },
    transition: transition
      ? {
          sequenceNo: Number(transition.trigger_sequence_no),
          fromState: transition.from_state,
          toState: transition.to_state,
          changeScore: Number(transition.change_score),
          persistenceCount: Number(transition.persistence_count),
        }
      : null,
  };
}

async function findExisting(connection, sessionId, sequenceNo, eventId) {
  const [eventRows] = await connection.execute(
    `SELECT session_id, sequence_no, event_id, at_ms, raw_event_type, product_id, event_source, behavior_dimension
     FROM uiadapt_events
     WHERE session_id = ? AND (sequence_no = ? OR event_id = ?)
     FOR UPDATE`,
    [sessionId, sequenceNo, eventId],
  );
  if (eventRows.length === 0) return null;
  const event = eventRows[0];
  const [snapshotRows] = await connection.execute(
    `SELECT event_count, window_size, browse_count, detail_count, compare_count, decision_count,
            cart_intent_count, current_browse, current_detail, current_compare, current_decision,
            current_cart_intent, reference_browse, reference_detail, reference_compare,
            reference_decision, reference_cart_intent, change_score, candidate_state,
            candidate_persistence, detected_state, applied_state
     FROM uiadapt_distribution_snapshots
     WHERE session_id = ? AND sequence_no = ?
     FOR UPDATE`,
    [sessionId, event.sequence_no],
  );
  const [transitionRows] = await connection.execute(
    `SELECT trigger_sequence_no, from_state, to_state, change_score, persistence_count
     FROM uiadapt_transitions
     WHERE session_id = ? AND trigger_sequence_no = ?
     FOR UPDATE`,
    [sessionId, event.sequence_no],
  );
  return canonicalizeTrajectory(frameFromRows(event, snapshotRows[0], transitionRows[0] ?? null));
}

export function createDbAdapter(pool) {
  return {
    async health() {
      await pool.execute("SELECT 1");
    },

    async createSession(payload) {
      try {
        await pool.execute(
          `INSERT INTO uiadapt_sessions (${SESSION_COLUMNS}) VALUES (?, ?, ?, ?)`,
          [payload.sessionId, payload.startedAtMs, payload.source, payload.adaptiveEnabled],
        );
        return { created: true };
      } catch (error) {
        if (error?.code !== "ER_DUP_ENTRY") throw error;
        const [rows] = await pool.execute(
          `SELECT ${SESSION_COLUMNS} FROM uiadapt_sessions WHERE session_id = ?`,
          [payload.sessionId],
        );
        const existing = rows[0];
        if (!existing || !sameJson({
          sessionId: existing.session_id,
          startedAtMs: Number(existing.started_at_ms),
          source: existing.event_source,
          adaptiveEnabled: Boolean(existing.adaptive_enabled),
        }, payload)) throw conflict();
        return { created: false };
      }
    },

    async appendTrajectory(payload) {
      const normalized = canonicalizeTrajectory(payload);
      assertTrajectoryConsistency(normalized);
      return withTransaction(pool, async (connection) => {
        const [sessionRows] = await connection.execute(
          "SELECT session_id, event_source, adaptive_enabled FROM uiadapt_sessions WHERE session_id = ? FOR UPDATE",
          [normalized.sessionId],
        );
        if (sessionRows.length === 0) throw notFound();
        if (sessionRows[0].event_source !== normalized.event.source) throw inconsistentTrajectory();
        assertTrajectoryPolicy(normalized, Boolean(sessionRows[0].adaptive_enabled));

        const existing = await findExisting(connection, normalized.sessionId, normalized.sequenceNo, normalized.event.id);
        if (existing) {
          if (sameTrajectory(existing, normalized)) return { duplicate: true };
          throw conflict();
        }

        const [previousRows] = await connection.execute(
          `SELECT sequence_no, at_ms
           FROM uiadapt_events
           WHERE session_id = ?
           ORDER BY sequence_no DESC
           LIMIT 1
           FOR UPDATE`,
          [normalized.sessionId],
        );
        const previous = previousRows[0];
        let previousSnapshot = null;
        if (previous) {
          const [snapshotRows] = await connection.execute(
            `SELECT sequence_no, detected_state, candidate_state, candidate_persistence
             FROM uiadapt_distribution_snapshots
             WHERE session_id = ? AND sequence_no = ?
             FOR UPDATE`,
            [normalized.sessionId, previous.sequence_no],
          );
          previousSnapshot = snapshotRows[0] ?? null;
        }
        assertTrajectoryContinuity(
          normalized,
          previous ? { ...previous, ...(previousSnapshot ?? {}) } : null,
        );
        if (
          (!previous && normalized.sequenceNo !== 1)
          || (previous && (
            normalized.sequenceNo !== Number(previous.sequence_no) + 1
            || normalized.event.atMs < Number(previous.at_ms)
          ))
        ) {
          throw inconsistentTrajectory();
        }

        await connection.execute(
          `INSERT INTO uiadapt_events
           (session_id, sequence_no, event_id, at_ms, raw_event_type, product_id, event_source, behavior_dimension)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            normalized.sessionId,
            normalized.sequenceNo,
            normalized.event.id,
            normalized.event.atMs,
            normalized.event.type,
            normalized.event.productId,
            normalized.event.source,
            normalized.behaviorDimension,
          ],
        );
        await connection.execute(
          `INSERT INTO uiadapt_distribution_snapshots
           (session_id, sequence_no, event_count, window_size, browse_count, detail_count, compare_count,
            decision_count, cart_intent_count, current_browse, current_detail, current_compare,
            current_decision, current_cart_intent, reference_browse, reference_detail, reference_compare,
            reference_decision, reference_cart_intent, change_score, candidate_state,
            candidate_persistence, detected_state, applied_state)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            normalized.sessionId,
            normalized.sequenceNo,
            normalized.snapshot.eventCount,
            normalized.snapshot.windowSize,
            normalized.snapshot.counts.BROWSE,
            normalized.snapshot.counts.DETAIL,
            normalized.snapshot.counts.COMPARE,
            normalized.snapshot.counts.DECISION,
            normalized.snapshot.counts.CART_INTENT,
            normalized.snapshot.current.BROWSE,
            normalized.snapshot.current.DETAIL,
            normalized.snapshot.current.COMPARE,
            normalized.snapshot.current.DECISION,
            normalized.snapshot.current.CART_INTENT,
            normalized.snapshot.reference.BROWSE,
            normalized.snapshot.reference.DETAIL,
            normalized.snapshot.reference.COMPARE,
            normalized.snapshot.reference.DECISION,
            normalized.snapshot.reference.CART_INTENT,
            normalized.snapshot.changeScore,
            normalized.snapshot.candidateState,
            normalized.snapshot.candidatePersistence,
            normalized.snapshot.detectedState,
            normalized.snapshot.appliedState,
          ],
        );
        if (normalized.transition) {
          await connection.execute(
            `INSERT INTO uiadapt_transitions
             (session_id, trigger_sequence_no, from_state, to_state, change_score, persistence_count)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              normalized.sessionId,
              normalized.sequenceNo,
              normalized.transition.fromState,
              normalized.transition.toState,
              normalized.transition.changeScore,
              normalized.transition.persistenceCount,
            ],
          );
        }
        return { duplicate: false };
      });
    },

    async getTrajectory(sessionId) {
      const [rows] = await pool.execute(
        `SELECT e.session_id, e.sequence_no, e.event_id, e.at_ms, e.raw_event_type,
                e.product_id, e.event_source, e.behavior_dimension,
                s.event_count, s.window_size, s.browse_count, s.detail_count,
                s.compare_count, s.decision_count, s.cart_intent_count,
                s.current_browse, s.current_detail, s.current_compare, s.current_decision,
                s.current_cart_intent, s.reference_browse, s.reference_detail,
                s.reference_compare, s.reference_decision, s.reference_cart_intent,
                s.change_score, s.candidate_state, s.candidate_persistence,
                s.detected_state, s.applied_state,
                t.trigger_sequence_no, t.from_state, t.to_state,
                t.change_score AS transition_change_score, t.persistence_count
         FROM uiadapt_events e
         INNER JOIN uiadapt_distribution_snapshots s
           ON s.session_id = e.session_id AND s.sequence_no = e.sequence_no
         LEFT JOIN uiadapt_transitions t
           ON t.session_id = e.session_id AND t.trigger_sequence_no = e.sequence_no
         WHERE e.session_id = ?
         ORDER BY e.sequence_no ASC`,
        [sessionId],
      );
      return rows.map((row) => frameFromRows(
        row,
        row,
        row.trigger_sequence_no === null ? null : {
          trigger_sequence_no: row.trigger_sequence_no,
          from_state: row.from_state,
          to_state: row.to_state,
          change_score: row.transition_change_score,
          persistence_count: row.persistence_count,
        },
      ));
    },
  };
}

export function createDatabaseFromEnv(env = process.env) {
  const pool = createMysqlPool(env);
  return { pool, db: createDbAdapter(pool) };
}
