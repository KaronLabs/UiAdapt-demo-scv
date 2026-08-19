import type { BehaviorEvent } from "./types";

export const REPLAY_DURATION_MS = 27_000;

export const REPLAY_EVENTS = Object.freeze([
  { id: "replay-01", atMs: 1_000, type: "VIEW_PRODUCT", productId: "aurora-one", source: "REPLAY" },
  { id: "replay-02", atMs: 3_000, type: "VIEW_PRODUCT", productId: "nova-pro", source: "REPLAY" },
  { id: "replay-03", atMs: 5_000, type: "CHECK_PRICE", productId: "aurora-one", source: "REPLAY" },
  { id: "replay-04", atMs: 7_000, type: "CHECK_REVIEWS", productId: "nova-pro", source: "REPLAY" },
  { id: "replay-05", atMs: 10_000, type: "ADD_COMPARE", productId: "aurora-one", source: "REPLAY" },
  { id: "replay-06", atMs: 12_000, type: "ADD_COMPARE", productId: "nova-pro", source: "REPLAY" },
  { id: "replay-07", atMs: 15_000, type: "VIEW_PRODUCT", productId: "aurora-one", source: "REPLAY" },
  { id: "replay-08", atMs: 17_000, type: "OPEN_DETAILS", productId: "aurora-one", source: "REPLAY" },
  { id: "replay-09", atMs: 19_000, type: "CHECK_REVIEWS", productId: "aurora-one", source: "REPLAY" },
  { id: "replay-10", atMs: 21_000, type: "SELECT_COLOR", productId: "aurora-one", source: "REPLAY" },
  { id: "replay-11", atMs: 23_000, type: "CHECK_SHIPPING", productId: "aurora-one", source: "REPLAY" },
  { id: "replay-12", atMs: 25_000, type: "ADD_TO_CART", productId: "aurora-one", source: "REPLAY" },
] satisfies readonly BehaviorEvent[]);
