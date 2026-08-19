export type ProductId = "aurora-one" | "nova-pro" | "halo-air";
export type AdaptiveState = "EXPLORE" | "COMPARE" | "FOCUS";
export type EventSource = "USER" | "REPLAY";

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
  distinctProducts: number;
  switchCount: number;
  interactionsByProduct: Record<ProductId, number>;
  dominantProduct: ProductId | null;
  dominantShare: number;
  /** Aggregate diagnostic count; state detection uses the per-product map below. */
  purchaseSupportSignals: number;
  purchaseSupportSignalsByProduct: Record<ProductId, number>;
}

export interface PresentationPolicy {
  appliedState: AdaptiveState;
  showComparison: boolean;
  focusedProductId: ProductId | null;
}

export type ReplayStatus =
  | "IDLE"
  | "RUNNING"
  | "PAUSED"
  | "STOPPED"
  | "STOPPED_MANUAL_TAKEOVER"
  | "COMPLETED";

export interface RuntimeSnapshot {
  sessionEpoch: number;
  events: readonly BehaviorEvent[];
  features: FeatureSnapshot;
  detectedState: AdaptiveState;
  appliedState: AdaptiveState;
  focusedProductId: ProductId | null;
  adaptiveEnabled: boolean;
  lastTransitionAtMs: number;
  lastEventAtMs: number;
  compareTray: readonly ProductId[];
  replayStatus: ReplayStatus;
  lastRejectedReason: string | null;
}

export type RuntimeAction =
  | { type: "RECORD_EVENT"; event: BehaviorEvent; epoch: number }
  | { type: "SET_ADAPTIVE"; enabled: boolean }
  | { type: "SET_REPLAY_STATUS"; status: ReplayStatus; epoch: number }
  | { type: "RESET" }
  | { type: "RESET_FOR_REPLAY" };
