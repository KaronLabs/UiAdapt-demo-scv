import type {
  AdaptiveState,
  BehaviorEvent,
  FeatureSnapshot,
  PresentationPolicy,
  ProductId,
  RuntimeAction,
  RuntimeSnapshot,
} from "./types";

const PRODUCT_IDS: readonly ProductId[] = ["aurora-one", "nova-pro", "halo-air"];
const PURCHASE_SIGNALS = new Set(["SELECT_COLOR", "CHECK_SHIPPING", "ADD_TO_CART"]);
const STATE_RANK: Record<AdaptiveState, number> = { EXPLORE: 0, COMPARE: 1, FOCUS: 2 };
const EVIDENCE_WINDOW_SIZE = 8;
const MIN_STATE_DWELL_MS = 3_000;

export function derivePolicy(
  detectedState: AdaptiveState,
  adaptiveEnabled: boolean,
  focusedProductId: ProductId | null,
): PresentationPolicy {
  const appliedState = adaptiveEnabled ? detectedState : "EXPLORE";
  return {
    appliedState,
    showComparison: appliedState === "COMPARE",
    focusedProductId: appliedState === "FOCUS" ? focusedProductId : null,
  };
}

function emptyFeatures(): FeatureSnapshot {
  return {
  windowSize: 0,
  distinctProducts: 0,
  switchCount: 0,
  interactionsByProduct: { "aurora-one": 0, "nova-pro": 0, "halo-air": 0 },
  dominantProduct: null,
  dominantShare: 0,
  purchaseSupportSignals: 0,
  purchaseSupportSignalsByProduct: { "aurora-one": 0, "nova-pro": 0, "halo-air": 0 },
  };
}

export function createInitialRuntime(adaptiveEnabled = true): RuntimeSnapshot {
  const policy = derivePolicy("EXPLORE", adaptiveEnabled, null);
  return {
    sessionEpoch: 0,
    events: [],
    features: emptyFeatures(),
    detectedState: "EXPLORE",
    appliedState: policy.appliedState,
    focusedProductId: null,
    adaptiveEnabled,
    lastTransitionAtMs: 0,
    lastEventAtMs: 0,
    compareTray: [],
    replayStatus: "IDLE",
    lastRejectedReason: null,
  };
}

export function deriveFeatures(events: readonly BehaviorEvent[]): FeatureSnapshot {
  const window = events.slice(-EVIDENCE_WINDOW_SIZE);
  const interactionsByProduct: Record<ProductId, number> = {
    "aurora-one": 0,
    "nova-pro": 0,
    "halo-air": 0,
  };
  let switchCount = 0;
  let purchaseSupportSignals = 0;
  const purchaseSupportSignalsByProduct: Record<ProductId, number> = {
    "aurora-one": 0,
    "nova-pro": 0,
    "halo-air": 0,
  };

  window.forEach((event, index) => {
    interactionsByProduct[event.productId] += 1;
    if (index > 0 && window[index - 1].productId !== event.productId) switchCount += 1;
    if (PURCHASE_SIGNALS.has(event.type)) {
      purchaseSupportSignals += 1;
      purchaseSupportSignalsByProduct[event.productId] += 1;
    }
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
    distinctProducts: PRODUCT_IDS.filter((id) => interactionsByProduct[id] > 0).length,
    switchCount,
    interactionsByProduct,
    dominantProduct,
    dominantShare: window.length === 0 ? 0 : dominantCount / window.length,
    purchaseSupportSignals,
    purchaseSupportSignalsByProduct,
  };
}

export function detectState(
  current: AdaptiveState,
  features: FeatureSnapshot,
  compareTray: readonly string[],
  nowMs: number,
  lastTransitionAtMs: number,
): AdaptiveState {
  let candidate: AdaptiveState = "EXPLORE";
  const dominantCount = features.dominantProduct
    ? features.interactionsByProduct[features.dominantProduct]
    : 0;

  if (
    features.windowSize >= 6 &&
    dominantCount >= 6 &&
    features.dominantShare >= 0.75 &&
    features.dominantProduct !== null &&
    features.purchaseSupportSignalsByProduct[features.dominantProduct] >= 1
  ) {
    candidate = "FOCUS";
  } else if (
    features.distinctProducts >= 2 &&
    (features.switchCount >= 3 || compareTray.length >= 2)
  ) {
    candidate = "COMPARE";
  }

  if (STATE_RANK[candidate] <= STATE_RANK[current]) return current;
  if (nowMs - lastTransitionAtMs < MIN_STATE_DWELL_MS) return current;
  return candidate;
}

function resetRuntime(state: RuntimeSnapshot, replayStatus: RuntimeSnapshot["replayStatus"]): RuntimeSnapshot {
  return {
    ...createInitialRuntime(state.adaptiveEnabled),
    sessionEpoch: state.sessionEpoch + 1,
    replayStatus,
  };
}

function reject(state: RuntimeSnapshot, reason: string): RuntimeSnapshot {
  return { ...state, lastRejectedReason: reason };
}

export function runtimeReducer(state: RuntimeSnapshot, action: RuntimeAction): RuntimeSnapshot {
  if (action.type === "RESET") return resetRuntime(state, "IDLE");
  if (action.type === "RESET_FOR_REPLAY") return resetRuntime(state, "RUNNING");

  if (action.type === "SET_ADAPTIVE") {
    const policy = derivePolicy(state.detectedState, action.enabled, state.focusedProductId);
    return {
      ...state,
      adaptiveEnabled: action.enabled,
      appliedState: policy.appliedState,
      lastRejectedReason: null,
    };
  }

  if (action.type === "SET_REPLAY_STATUS") {
    if (action.epoch !== state.sessionEpoch) return reject(state, "STALE_SESSION_EPOCH");
    return { ...state, replayStatus: action.status, lastRejectedReason: null };
  }

  const { event, epoch } = action;
  if (epoch !== state.sessionEpoch) return reject(state, "STALE_SESSION_EPOCH");
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
  const detectedState = detectState(
    state.detectedState,
    features,
    compareTray,
    event.atMs,
    state.lastTransitionAtMs,
  );
  const stateChanged = detectedState !== state.detectedState;
  const manualTakeover =
    event.source === "USER" && (state.replayStatus === "RUNNING" || state.replayStatus === "PAUSED");
  const focusedProductId = detectedState === "FOCUS" ? features.dominantProduct : state.focusedProductId;
  const policy = derivePolicy(detectedState, state.adaptiveEnabled, focusedProductId);

  return {
    ...state,
    events,
    features,
    detectedState,
    appliedState: policy.appliedState,
    focusedProductId,
    lastTransitionAtMs: stateChanged ? event.atMs : state.lastTransitionAtMs,
    lastEventAtMs: event.atMs,
    compareTray,
    replayStatus: manualTakeover ? "STOPPED_MANUAL_TAKEOVER" : state.replayStatus,
    lastRejectedReason: null,
  };
}
