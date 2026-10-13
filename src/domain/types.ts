export type ProductId = "aurora-one" | "nova-pro" | "halo-air";
export type DistributionState = "EXPLORE" | "COMPARE" | "PURCHASE_INTENT";
export type AdaptiveState = DistributionState;
export type EventSource = "USER" | "REPLAY";
export type BehaviorDimension = "BROWSE" | "DETAIL" | "COMPARE" | "DECISION" | "CART_INTENT";

export interface Distribution {
  BROWSE: number;
  DETAIL: number;
  COMPARE: number;
  DECISION: number;
  CART_INTENT: number;
}

export type DistributionCounts = Record<BehaviorDimension, number>;

export interface DistributionEvaluation {
  eventCount: number;
  windowSize: number;
  counts: DistributionCounts;
  current: Distribution;
  reference: Distribution;
  changeScore: number;
}

export interface DistributionSnapshot {
  eventCount: number;
  windowSize: number;
  counts: DistributionCounts;
  current: Distribution;
  reference: Distribution;
  changeScore: number;
  candidateState: DistributionState;
  candidatePersistence: number;
  detectedState: DistributionState;
  appliedState: DistributionState;
  adaptiveEnabled: boolean;
}

export interface StateTransition {
  sequenceNo?: number;
  fromState: DistributionState;
  toState: DistributionState;
  changeScore: number;
  persistenceCount: number;
}

export type BehaviorEventType =
  | "VIEW_PRODUCT"
  | "OPEN_DETAILS"
  | "CHECK_PRICE"
  | "CHECK_REVIEWS"
  | "SELECT_COLOR"
  | "CHECK_SHIPPING"
  | "ADD_COMPARE"
  | "REMOVE_COMPARE"
  | "ADD_TO_CART";

export interface Product {
  id: ProductId;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  batteryHours: number;
  anc: string;
  weightGrams: number;
  shipping: string;
  inventory: number;
  colors: readonly string[];
  tagline: string;
  detail: string;
}

export interface BehaviorEvent {
  id: string;
  atMs: number;
  type: BehaviorEventType;
  productId: ProductId;
  source: EventSource;
}

export interface FeatureSnapshot {
  windowSize: number;
  interactionsByProduct: Record<ProductId, number>;
  dominantProduct: ProductId | null;
}

export interface PresentationPolicy {
  appliedState: AdaptiveState;
  showComparison: boolean;
  focusedProductId: ProductId | null;
}

export type TelemetryStatus = "HEALTHY" | "DEGRADED" | "OVERFLOW" | "DISABLED";

export interface TelemetrySession {
  sessionId: string;
  startedAtMs: number;
  source: EventSource;
  adaptiveEnabled: boolean;
}

export interface TelemetryFrame {
  sessionId: string;
  sequenceNo: number;
  event: BehaviorEvent;
  behaviorDimension: BehaviorDimension;
  snapshot: DistributionSnapshot;
  transition: StateTransition | null;
}

export type ReplayStatus =
  | "IDLE"
  | "RUNNING"
  | "PAUSED"
  | "STOPPED"
  | "STOPPED_MANUAL_TAKEOVER"
  | "COMPLETED";

export interface RuntimeSnapshot {
  sessionId: string;
  sessionEpoch: number;
  sequenceNo: number;
  events: readonly BehaviorEvent[];
  features: FeatureSnapshot;
  distribution: DistributionEvaluation;
  candidateState: DistributionState;
  detectedState: AdaptiveState;
  appliedState: AdaptiveState;
  focusedProductId: ProductId | null;
  adaptiveEnabled: boolean;
  lastTransitionAtMs: number;
  lastEventAtMs: number;
  compareTray: readonly ProductId[];
  pendingCandidate: DistributionState | null;
  candidatePersistence: number;
  lastTransition: StateTransition | null;
  transitions: readonly StateTransition[];
  telemetryStatus: TelemetryStatus;
  replayStatus: ReplayStatus;
  lastRejectedReason: string | null;
}

export type RuntimeAction =
  | { type: "RECORD_EVENT"; event: BehaviorEvent; epoch: number }
  | { type: "SET_ADAPTIVE"; enabled: boolean }
  | { type: "SET_TELEMETRY_STATUS"; status: TelemetryStatus }
  | { type: "SET_REPLAY_STATUS"; status: ReplayStatus; epoch: number }
  | { type: "RESET"; sessionId?: string }
  | { type: "RESET_FOR_REPLAY"; sessionId?: string };
