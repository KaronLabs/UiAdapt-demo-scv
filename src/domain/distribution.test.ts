import { describe, expect, it } from "vitest";
import { REFERENCE_DISTRIBUTION } from "./behaviorConfig";
import { evaluateDistribution, normalizedL1 } from "./distribution";
import type { BehaviorEvent, BehaviorEventType, Distribution } from "./types";

function event(sequenceNo: number, type: BehaviorEventType): BehaviorEvent {
  return {
    id: `event-${sequenceNo}`,
    atMs: sequenceNo * 1_000,
    type,
    productId: "aurora-one",
    source: "USER",
  };
}

describe("behavior distribution", () => {
  it("keeps only the last twenty events", () => {
    const events = [
      event(1, "CHECK_REVIEWS"),
      ...Array.from({ length: 20 }, (_, index) => event(index + 2, "VIEW_PRODUCT")),
    ];
    const result = evaluateDistribution(events);

    expect(result.windowSize).toBe(20);
    expect(result.eventCount).toBe(21);
    expect(result.counts.BROWSE).toBe(20);
    expect(result.counts.DECISION).toBe(0);
  });

  it("normalizes non-empty counts to one and keeps values in range", () => {
    const result = evaluateDistribution([
      event(1, "VIEW_PRODUCT"),
      event(2, "OPEN_DETAILS"),
    ]);
    const sum = Object.values(result.current).reduce((total, value) => total + value, 0);

    expect(sum).toBeCloseTo(1, 9);
    expect(Object.values(result.current).every((value) => value >= 0 && value <= 1)).toBe(true);
  });

  it("returns zero for identical and one for disjoint distributions", () => {
    const disjointA: Distribution = { BROWSE: 1, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 };
    const disjointB: Distribution = { BROWSE: 0, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 1 };

    expect(normalizedL1(REFERENCE_DISTRIBUTION, REFERENCE_DISTRIBUTION)).toBe(0);
    expect(normalizedL1(disjointA, disjointB)).toBe(1);
  });

  it("keeps threshold comparisons on the raw score", () => {
    const score = normalizedL1(
      REFERENCE_DISTRIBUTION,
      { BROWSE: 0.3499999999999999, DETAIL: 0.2, COMPARE: 0.45, DECISION: 0, CART_INTENT: 0 },
    );

    expect(score).toBeGreaterThanOrEqual(0.3);
    expect(score.toFixed(2)).toBe("0.30");
  });

  it("returns empty evidence without inventing a distribution", () => {
    const result = evaluateDistribution([]);

    expect(result.eventCount).toBe(0);
    expect(result.windowSize).toBe(0);
    expect(result.changeScore).toBe(0);
    expect(result.current).toEqual({ BROWSE: 0, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 });
  });
});
