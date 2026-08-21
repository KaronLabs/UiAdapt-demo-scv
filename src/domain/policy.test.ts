import { describe, expect, it } from "vitest";
import { derivePolicy } from "./policy";

describe("presentation policy", () => {
  it.each([
    ["EXPLORE", true, null, { appliedState: "EXPLORE", showComparison: false, focusedProductId: null }],
    ["COMPARE", true, null, { appliedState: "COMPARE", showComparison: true, focusedProductId: null }],
    ["PURCHASE_INTENT", true, "aurora-one", { appliedState: "PURCHASE_INTENT", showComparison: false, focusedProductId: "aurora-one" }],
    ["COMPARE", false, null, { appliedState: "EXPLORE", showComparison: false, focusedProductId: null }],
    ["PURCHASE_INTENT", false, "aurora-one", { appliedState: "EXPLORE", showComparison: false, focusedProductId: null }],
  ] as const)("maps %s with Adaptive %s to an explicit policy", (detectedState, adaptiveEnabled, focusedProductId, expected) => {
    expect(derivePolicy(detectedState, adaptiveEnabled, focusedProductId)).toEqual(expected);
  });
});
