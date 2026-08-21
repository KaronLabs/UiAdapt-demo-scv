import { WINDOW_SIZE } from "./behaviorConfig";
import { isBehaviorEventType } from "./behaviorTaxonomy";
import { evaluateDistribution } from "./distribution";
import { derivePolicy } from "./policy";
import { evaluateTransition } from "./transitionEngine";
import type {
  BehaviorEvent,
  FeatureSnapshot,
  ProductId,
  RuntimeAction,
  RuntimeSnapshot,
  TelemetryStatus,
} from "./types";

export { derivePolicy } from "./policy";

const PRODUCT_IDS: readonly ProductId[] = ["aurora-one", "nova-pro", "halo-air"];

function emptyFeatures(): FeatureSnapshot {
  return {
    windowSize: 0,
    interactionsByProduct: { "aurora-one": 0, "nova-pro": 0, "halo-air": 0 },
    dominantProduct: null,
  };
}

export function createInitialRuntime(adaptiveEnabled = true, sessionId = "session-0"): RuntimeSnapshot {
  const policy = derivePolicy("EXPLORE", adaptiveEnabled, null);
  return {
    sessionId,
    sessionEpoch: 0,
    sequenceNo: 0,
    events: [],
    features: emptyFeatures(),
    distribution: evaluateDistribution([]),
    candidateState: "EXPLORE",
    detectedState: "EXPLORE",
    appliedState: policy.appliedState,
    focusedProductId: null,
    adaptiveEnabled,
    lastTransitionAtMs: 0,
    lastEventAtMs: 0,
    compareTray: [],
    pendingCandidate: null,
    candidatePersistence: 0,
    lastTransition: null,
    transitions: [],
    telemetryStatus: "HEALTHY",
    replayStatus: "IDLE",
    lastRejectedReason: null,
  };
}

export function deriveFeatures(events: readonly BehaviorEvent[]): FeatureSnapshot {
  const window = events.slice(-WINDOW_SIZE);
  const interactionsByProduct: Record<ProductId, number> = {
    "aurora-one": 0,
    "nova-pro": 0,
    "halo-air": 0,
  };

  window.forEach((event) => {
    interactionsByProduct[event.productId] += 1;
  });

  let dominantProduct: ProductId | null = null;
  let dominantCount = 0;
  for (const productId of PRODUCT_IDS) {
    const count = interactionsByProduct[productId];
    if (count > dominantCount) {
      dominantProduct = productId;
      dominantCount = count;
    }
  }

  return {
    windowSize: window.length,
    interactionsByProduct,
    dominantProduct,
  };
}

function resetRuntime(
  state: RuntimeSnapshot,
  replayStatus: RuntimeSnapshot["replayStatus"],
  sessionId?: string,
): RuntimeSnapshot {
  return {
    ...createInitialRuntime(state.adaptiveEnabled, sessionId ?? `session-${state.sessionEpoch + 1}`),
    sessionEpoch: state.sessionEpoch + 1,
    replayStatus,
  };
}

function reject(state: RuntimeSnapshot, reason: string): RuntimeSnapshot {
  return { ...state, lastRejectedReason: reason };
}

export function runtimeReducer(state: RuntimeSnapshot, action: RuntimeAction): RuntimeSnapshot {
  if (action.type === "RESET") return resetRuntime(state, "IDLE", action.sessionId);
  if (action.type === "RESET_FOR_REPLAY") return resetRuntime(state, "RUNNING", action.sessionId);

  if (action.type === "SET_ADAPTIVE") {
    const policy = derivePolicy(state.detectedState, action.enabled, state.focusedProductId);
    return {
      ...state,
      adaptiveEnabled: action.enabled,
      appliedState: policy.appliedState,
      focusedProductId: policy.focusedProductId,
      lastRejectedReason: null,
    };
  }

  if (action.type === "SET_TELEMETRY_STATUS") {
    const status: TelemetryStatus = action.status;
    return { ...state, telemetryStatus: status };
  }

  if (action.type === "SET_REPLAY_STATUS") {
    if (action.epoch !== state.sessionEpoch) return reject(state, "STALE_SESSION_EPOCH");
    return { ...state, replayStatus: action.status, lastRejectedReason: null };
  }

  const { event, epoch } = action;
  if (epoch !== state.sessionEpoch) return reject(state, "STALE_SESSION_EPOCH");
  if (!isBehaviorEventType(event.type)) return reject(state, "UNKNOWN_EVENT_TYPE");
  if (!Number.isFinite(event.atMs) || event.atMs < 0) return reject(state, "INVALID_EVENT_CLOCK");
  if (!PRODUCT_IDS.includes(event.productId)) return reject(state, "UNKNOWN_PRODUCT_ID");
  if (state.events.some((existing) => existing.id === event.id)) return reject(state, "DUPLICATE_EVENT_ID");
  if (event.atMs < state.lastEventAtMs) return reject(state, "NON_MONOTONIC_EVENT_CLOCK");

  let compareTray = [...state.compareTray];
  if (event.type === "ADD_COMPARE" && !compareTray.includes(event.productId)) {
    compareTray.push(event.productId);
  }
  if (event.type === "REMOVE_COMPARE") {
    compareTray = compareTray.filter((productId) => productId !== event.productId);
  }

  const events = [...state.events, event];
  const features = deriveFeatures(events);
  const distribution = evaluateDistribution(events);
  const transition = evaluateTransition(
    {
      detectedState: state.detectedState,
      pendingCandidate: state.pendingCandidate,
      candidatePersistence: state.candidatePersistence,
    },
    distribution.current,
    distribution.eventCount,
  );
  const detectedState = transition.detectedState;
  const focusedProductId = detectedState === "PURCHASE_INTENT" ? features.dominantProduct : null;
  const policy = derivePolicy(detectedState, state.adaptiveEnabled, focusedProductId);
  const stateTransition = transition.transition
    ? { ...transition.transition, sequenceNo: state.sequenceNo + 1 }
    : null;
  const candidatePersistence = stateTransition
    ? stateTransition.persistenceCount
    : transition.candidatePersistence;
  const manualTakeover =
    event.source === "USER" && (state.replayStatus === "RUNNING" || state.replayStatus === "PAUSED");

  return {
    ...state,
    sequenceNo: state.sequenceNo + 1,
    events,
    features,
    distribution,
    candidateState: transition.candidateState,
    detectedState,
    appliedState: policy.appliedState,
    focusedProductId: policy.focusedProductId,
    pendingCandidate: transition.pendingCandidate,
    candidatePersistence,
    lastTransition: stateTransition ?? state.lastTransition,
    transitions: stateTransition ? [...state.transitions, stateTransition] : state.transitions,
    lastTransitionAtMs: stateTransition ? event.atMs : state.lastTransitionAtMs,
    lastEventAtMs: event.atMs,
    compareTray,
    replayStatus: manualTakeover ? "STOPPED_MANUAL_TAKEOVER" : state.replayStatus,
    lastRejectedReason: null,
  };
}
