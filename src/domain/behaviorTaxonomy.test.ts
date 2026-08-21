import { describe, expect, it } from "vitest";
import { ENTER_THRESHOLD, MINIMUM_EVIDENCE, REFERENCE_DISTRIBUTION, RELEASE_THRESHOLD, REQUIRED_PERSISTENCE, WINDOW_SIZE } from "./behaviorConfig";
import { classifyBehavior } from "./behaviorTaxonomy";
import type { BehaviorEvent, BehaviorEventType, BehaviorDimension } from "./types";

const EVENT_TYPES: readonly BehaviorEventType[] = [
  "VIEW_PRODUCT",
  "OPEN_DETAILS",
  "CHECK_PRICE",
  "CHECK_REVIEWS",
  "SELECT_COLOR",
  "CHECK_SHIPPING",
  "ADD_COMPARE",
  "REMOVE_COMPARE",
  "ADD_TO_CART",
];

const EXPECTED_DIMENSIONS: Record<BehaviorEventType, BehaviorDimension> = {
  VIEW_PRODUCT: "BROWSE",
  OPEN_DETAILS: "DETAIL",
  CHECK_PRICE: "DECISION",
  CHECK_REVIEWS: "DECISION",
  SELECT_COLOR: "DECISION",
  CHECK_SHIPPING: "DECISION",
  ADD_COMPARE: "COMPARE",
  REMOVE_COMPARE: "COMPARE",
  ADD_TO_CART: "CART_INTENT",
};

function event(type: BehaviorEventType): BehaviorEvent {
  return { id: type, atMs: 1_000, type, productId: "aurora-one", source: "USER" };
}

describe("behavior taxonomy", () => {
  it("maps every current raw event to exactly one dimension", () => {
    const dimensions = EVENT_TYPES.map((type) => classifyBehavior(event(type)));

    expect(dimensions).toEqual(EVENT_TYPES.map((type) => EXPECTED_DIMENSIONS[type]));
    expect(new Set(dimensions)).toEqual(new Set([
      "BROWSE",
      "DETAIL",
      "COMPARE",
      "DECISION",
      "CART_INTENT",
    ]));
  });

  it("exports the v1 reference and gate constants", () => {
    expect(REFERENCE_DISTRIBUTION).toEqual({
      BROWSE: 0.5,
      DETAIL: 0.2,
      COMPARE: 0.15,
      DECISION: 0.1,
      CART_INTENT: 0.05,
    });
    expect(WINDOW_SIZE).toBe(20);
    expect(MINIMUM_EVIDENCE).toBe(15);
    expect(ENTER_THRESHOLD).toBe(0.3);
    expect(RELEASE_THRESHOLD).toBe(0.2);
    expect(REQUIRED_PERSISTENCE).toBe(3);
  });
});
