import type { Distribution } from "./types";

export const WINDOW_SIZE = 20;
export const MINIMUM_EVIDENCE = 15;
export const ENTER_THRESHOLD = 0.3;
export const RELEASE_THRESHOLD = 0.2;
export const REQUIRED_PERSISTENCE = 3;

export const REFERENCE_DISTRIBUTION = Object.freeze({
  BROWSE: 0.5,
  DETAIL: 0.2,
  COMPARE: 0.15,
  DECISION: 0.1,
  CART_INTENT: 0.05,
} satisfies Distribution);
