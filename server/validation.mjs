import { Buffer } from "node:buffer";

export const BODY_LIMIT_BYTES = 64 * 1024;

const EVENT_TYPES = new Set([
  "VIEW_PRODUCT",
  "OPEN_DETAILS",
  "CHECK_PRICE",
  "CHECK_REVIEWS",
  "SELECT_COLOR",
  "CHECK_SHIPPING",
  "ADD_COMPARE",
  "REMOVE_COMPARE",
  "ADD_TO_CART",
]);
const PRODUCT_IDS = new Set(["aurora-one", "nova-pro", "halo-air"]);
const EVENT_SOURCES = new Set(["USER", "REPLAY"]);
const DIMENSIONS = new Set(["BROWSE", "DETAIL", "COMPARE", "DECISION", "CART_INTENT"]);
const STATES = new Set(["EXPLORE", "COMPARE", "PURCHASE_INTENT"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DIMENSION_KEYS = ["BROWSE", "DETAIL", "COMPARE", "DECISION", "CART_INTENT"];
const EVENT_DIMENSIONS = new Map([
  ["VIEW_PRODUCT", "BROWSE"],
  ["OPEN_DETAILS", "DETAIL"],
  ["ADD_COMPARE", "COMPARE"],
  ["REMOVE_COMPARE", "COMPARE"],
  ["CHECK_PRICE", "DECISION"],
  ["CHECK_REVIEWS", "DECISION"],
  ["SELECT_COLOR", "DECISION"],
  ["CHECK_SHIPPING", "DECISION"],
  ["ADD_TO_CART", "CART_INTENT"],
]);
const REFERENCE_DISTRIBUTION = Object.freeze({
  BROWSE: 0.5,
  DETAIL: 0.2,
  COMPARE: 0.15,
  DECISION: 0.1,
  CART_INTENT: 0.05,
});
const DECIMAL_SCALE = 10;
const DECIMAL_EPSILON = 1e-9;
const MINIMUM_EVIDENCE = 15;
const REQUIRED_PERSISTENCE = 3;

export class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function invalid(code) {
  throw new ApiError(400, code);
}

function semantic(code) {
  throw new ApiError(422, code);
}

function requireObject(value, code) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) invalid(code);
  return value;
}

function requireString(value, code, { maxLength = 128 } = {}) {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) invalid(code);
  return value;
}

function requireEnum(value, values, code) {
  if (typeof value !== "string" || !values.has(value)) semantic(code);
  return value;
}

function requireInteger(value, code, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) invalid(code);
  return value;
}

function requireNumber(value, code, { min = 0, max = 1 } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) invalid(code);
  return value;
}

export function canonicalDecimal(value) {
  return Number(value.toFixed(DECIMAL_SCALE));
}

function canonicalDistribution(distribution) {
  return Object.fromEntries(DIMENSION_KEYS.map((dimension) => [dimension, canonicalDecimal(distribution[dimension])]));
}

function closeEnough(left, right) {
  return Math.abs(left - right) <= DECIMAL_EPSILON;
}

function requireUuid(value, code) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) invalid(code);
  return value;
}

export async function readJsonBody(request) {
  const contentType = String(request.headers["content-type"] ?? "").split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") invalid("JSON_CONTENT_TYPE_REQUIRED");
  const contentLength = Number(request.headers["content-length"] ?? 0);
  if (Number.isFinite(contentLength) && contentLength > BODY_LIMIT_BYTES) {
    throw new ApiError(413, "BODY_TOO_LARGE");
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += Buffer.byteLength(chunk);
    if (size > BODY_LIMIT_BYTES) throw new ApiError(413, "BODY_TOO_LARGE");
    chunks.push(chunk);
  }
  if (chunks.length === 0) invalid("JSON_BODY_REQUIRED");
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    invalid("MALFORMED_JSON");
  }
}

export function validateSession(payload) {
  const body = requireObject(payload, "SESSION_OBJECT_REQUIRED");
  return {
    sessionId: requireUuid(body.sessionId, "INVALID_SESSION_ID"),
    startedAtMs: requireInteger(body.startedAtMs, "INVALID_STARTED_AT_MS"),
    source: requireEnum(body.source, EVENT_SOURCES, "INVALID_SESSION_SOURCE"),
    adaptiveEnabled: typeof body.adaptiveEnabled === "boolean"
      ? body.adaptiveEnabled
      : invalid("INVALID_ADAPTIVE_ENABLED"),
  };
}

function validateCounts(counts) {
  const body = requireObject(counts, "INVALID_COUNTS");
  return {
    BROWSE: requireInteger(body.BROWSE, "INVALID_BROWSE_COUNT", { max: 20 }),
    DETAIL: requireInteger(body.DETAIL, "INVALID_DETAIL_COUNT", { max: 20 }),
    COMPARE: requireInteger(body.COMPARE, "INVALID_COMPARE_COUNT", { max: 20 }),
    DECISION: requireInteger(body.DECISION, "INVALID_DECISION_COUNT", { max: 20 }),
    CART_INTENT: requireInteger(body.CART_INTENT, "INVALID_CART_INTENT_COUNT", { max: 20 }),
  };
}

function validateDistribution(distribution, prefix) {
  const body = requireObject(distribution, `${prefix}_DISTRIBUTION_REQUIRED`);
  return {
    BROWSE: canonicalDecimal(requireNumber(body.BROWSE, `INVALID_${prefix}_BROWSE`)),
    DETAIL: canonicalDecimal(requireNumber(body.DETAIL, `INVALID_${prefix}_DETAIL`)),
    COMPARE: canonicalDecimal(requireNumber(body.COMPARE, `INVALID_${prefix}_COMPARE`)),
    DECISION: canonicalDecimal(requireNumber(body.DECISION, `INVALID_${prefix}_DECISION`)),
    CART_INTENT: canonicalDecimal(requireNumber(body.CART_INTENT, `INVALID_${prefix}_CART_INTENT`)),
  };
}

function validateEvent(event) {
  const body = requireObject(event, "EVENT_OBJECT_REQUIRED");
  return {
    id: requireString(body.id, "INVALID_EVENT_ID"),
    atMs: requireInteger(body.atMs, "INVALID_EVENT_AT_MS"),
    type: requireEnum(body.type, EVENT_TYPES, "INVALID_EVENT_TYPE"),
    productId: requireEnum(body.productId, PRODUCT_IDS, "INVALID_PRODUCT_ID"),
    source: requireEnum(body.source, EVENT_SOURCES, "INVALID_EVENT_SOURCE"),
  };
}

function validateTransition(transition) {
  if (transition === null) return null;
  const body = requireObject(transition, "INVALID_TRANSITION");
  return {
    sequenceNo: requireInteger(body.sequenceNo, "INVALID_TRANSITION_SEQUENCE", { min: 1 }),
    fromState: requireEnum(body.fromState, STATES, "INVALID_TRANSITION_FROM"),
    toState: requireEnum(body.toState, STATES, "INVALID_TRANSITION_TO"),
    changeScore: canonicalDecimal(requireNumber(body.changeScore, "INVALID_TRANSITION_SCORE")),
    persistenceCount: requireInteger(body.persistenceCount, "INVALID_PERSISTENCE_COUNT", { min: 1, max: 3 }),
  };
}

function validateSnapshot(snapshot) {
  const body = requireObject(snapshot, "SNAPSHOT_OBJECT_REQUIRED");
  return {
    eventCount: requireInteger(body.eventCount, "INVALID_EVENT_COUNT"),
    windowSize: requireInteger(body.windowSize, "INVALID_WINDOW_SIZE", { max: 20 }),
    counts: validateCounts(body.counts),
    current: validateDistribution(body.current, "CURRENT"),
    reference: validateDistribution(body.reference, "REFERENCE"),
    changeScore: canonicalDecimal(requireNumber(body.changeScore, "INVALID_CHANGE_SCORE")),
    candidateState: requireEnum(body.candidateState, STATES, "INVALID_CANDIDATE_STATE"),
    candidatePersistence: requireInteger(body.candidatePersistence, "INVALID_CANDIDATE_PERSISTENCE", { max: 3 }),
    detectedState: requireEnum(body.detectedState, STATES, "INVALID_DETECTED_STATE"),
    appliedState: requireEnum(body.appliedState, STATES, "INVALID_APPLIED_STATE"),
  };
}

function distributionSum(distribution) {
  return DIMENSION_KEYS.reduce((sum, dimension) => sum + distribution[dimension], 0);
}

function countsSum(counts) {
  return DIMENSION_KEYS.reduce((sum, dimension) => sum + counts[dimension], 0);
}

function expectedChangeScore(current, reference) {
  const distance = DIMENSION_KEYS.reduce(
    (sum, dimension) => sum + Math.abs(current[dimension] - reference[dimension]),
    0,
  );
  return canonicalDecimal(Math.min(1, Math.max(0, distance / 2)));
}

export function assertTrajectoryConsistency(payload) {
  const { event, behaviorDimension, sequenceNo, snapshot, transition } = payload;
  if (EVENT_DIMENSIONS.get(event.type) !== behaviorDimension) semantic("TRAJECTORY_INCONSISTENT");
  if (snapshot.eventCount !== sequenceNo) semantic("TRAJECTORY_INCONSISTENT");

  const expectedWindowSize = Math.min(sequenceNo, 20);
  if (snapshot.windowSize !== expectedWindowSize || countsSum(snapshot.counts) !== snapshot.windowSize) {
    semantic("TRAJECTORY_INCONSISTENT");
  }

  for (const dimension of DIMENSION_KEYS) {
    const expectedCurrent = snapshot.windowSize === 0 ? 0 : snapshot.counts[dimension] / snapshot.windowSize;
    if (!closeEnough(snapshot.current[dimension], expectedCurrent)) semantic("TRAJECTORY_INCONSISTENT");
    if (!closeEnough(snapshot.reference[dimension], REFERENCE_DISTRIBUTION[dimension])) {
      semantic("TRAJECTORY_INCONSISTENT");
    }
  }

  const expectedCurrentSum = snapshot.windowSize === 0 ? 0 : 1;
  if (!closeEnough(distributionSum(snapshot.current), expectedCurrentSum)) semantic("TRAJECTORY_INCONSISTENT");
  if (!closeEnough(distributionSum(snapshot.reference), 1)) semantic("TRAJECTORY_INCONSISTENT");
  if (!closeEnough(snapshot.changeScore, expectedChangeScore(snapshot.current, snapshot.reference))) {
    semantic("TRAJECTORY_INCONSISTENT");
  }

  if (transition !== null) {
    if (
      transition.sequenceNo !== sequenceNo
      || transition.fromState === transition.toState
      || transition.toState !== snapshot.detectedState
      || transition.persistenceCount !== snapshot.candidatePersistence
      || !closeEnough(transition.changeScore, snapshot.changeScore)
    ) {
      semantic("TRAJECTORY_INCONSISTENT");
    }
  }
  return payload;
}

export function assertTrajectoryContinuity(payload, previous) {
  if (payload.transition === null) return payload;

  if (
    payload.snapshot.eventCount < MINIMUM_EVIDENCE
    || previous === null
    || Number(previous.sequence_no) !== payload.sequenceNo - 1
    || previous.detected_state !== payload.transition.fromState
    || previous.candidate_state !== payload.transition.toState
    || Number(previous.candidate_persistence) !== REQUIRED_PERSISTENCE - 1
    || payload.snapshot.candidateState !== payload.transition.toState
    || payload.snapshot.candidatePersistence !== REQUIRED_PERSISTENCE
  ) {
    semantic("TRAJECTORY_INCONSISTENT");
  }

  return payload;
}

export function canonicalizeTrajectory(payload) {
  return {
    ...payload,
    snapshot: {
      ...payload.snapshot,
      current: canonicalDistribution(payload.snapshot.current),
      reference: canonicalDistribution(payload.snapshot.reference),
      changeScore: canonicalDecimal(payload.snapshot.changeScore),
    },
    transition: payload.transition === null
      ? null
      : { ...payload.transition, changeScore: canonicalDecimal(payload.transition.changeScore) },
  };
}

export function validateTrajectory(payload) {
  const body = requireObject(payload, "TRAJECTORY_OBJECT_REQUIRED");
  const trajectory = {
    sessionId: requireUuid(body.sessionId, "INVALID_SESSION_ID"),
    sequenceNo: requireInteger(body.sequenceNo, "INVALID_SEQUENCE_NO", { min: 1 }),
    event: validateEvent(body.event),
    behaviorDimension: requireEnum(body.behaviorDimension, DIMENSIONS, "INVALID_BEHAVIOR_DIMENSION"),
    snapshot: validateSnapshot(body.snapshot),
    transition: validateTransition(body.transition),
  };
  return assertTrajectoryConsistency(trajectory);
}

export function validateSessionId(value) {
  return requireUuid(value, "INVALID_SESSION_ID");
}
