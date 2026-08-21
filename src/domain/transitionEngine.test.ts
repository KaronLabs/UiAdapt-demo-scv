import { describe, expect, it } from "vitest";
import { REFERENCE_DISTRIBUTION } from "./behaviorConfig";
import { normalizedL1 } from "./distribution";
import {
  evaluateTransition,
  type TransitionContext,
  type TransitionEvaluation,
} from "./transitionEngine";
import type { Distribution, DistributionState } from "./types";

const compareDistribution: Distribution = {
  BROWSE: 0.35,
  DETAIL: 0.2,
  COMPARE: 0.45,
  DECISION: 0,
  CART_INTENT: 0,
};

const purchaseDistribution: Distribution = {
  BROWSE: 0.05,
  DETAIL: 0.1,
  COMPARE: 0.1,
  DECISION: 0.55,
  CART_INTENT: 0.2,
};

const releaseBoundaryDistribution: Distribution = {
  BROWSE: 0.3,
  DETAIL: 0.2,
  COMPARE: 0.15,
  DECISION: 0.3,
  CART_INTENT: 0.05,
};

function context(
  detectedState: DistributionState = "EXPLORE",
  pendingCandidate: DistributionState | null = null,
  candidatePersistence = 0,
): TransitionContext {
  return { detectedState, pendingCandidate, candidatePersistence };
}

function advance(
  previous: TransitionEvaluation,
  distribution: Distribution,
  eventCount: number,
): TransitionEvaluation {
  return evaluateTransition(
    {
      detectedState: previous.detectedState,
      pendingCandidate: previous.pendingCandidate,
      candidatePersistence: previous.candidatePersistence,
    },
    distribution,
    eventCount,
  );
}

function play(
  initialState: DistributionState,
  distribution: Distribution,
  eventCount = 15,
): TransitionEvaluation {
  let result = evaluateTransition(context(initialState), distribution, eventCount);
  result = advance(result, distribution, eventCount + 1);
  return advance(result, distribution, eventCount + 2);
}

describe("distribution transition engine", () => {
  it("does not transition with fourteen events", () => {
    const result = evaluateTransition(context(), compareDistribution, 14);

    expect(result.detectedState).toBe("EXPLORE");
    expect(result.transition).toBeNull();
    expect(result.candidatePersistence).toBe(0);
  });

  it("requires three identical eligible candidate evaluations", () => {
    const first = evaluateTransition(context(), compareDistribution, 15);
    const second = advance(first, compareDistribution, 16);
    const third = advance(second, compareDistribution, 17);

    expect(first.candidatePersistence).toBe(1);
    expect(second.candidatePersistence).toBe(2);
    expect(third.candidatePersistence).toBe(0);
    expect(third.transition).toMatchObject({ fromState: "EXPLORE", toState: "COMPARE", persistenceCount: 3 });
    expect(third.detectedState).toBe("COMPARE");
  });

  it("does not transition on one eligible spike", () => {
    const result = evaluateTransition(context(), compareDistribution, 15);

    expect(result.candidateState).toBe("COMPARE");
    expect(result.candidatePersistence).toBe(1);
    expect(result.transition).toBeNull();
    expect(result.detectedState).toBe("EXPLORE");
  });

  it("resets persistence when the candidate flips", () => {
    const compare = evaluateTransition(context(), compareDistribution, 15);
    const purchase = advance(compare, purchaseDistribution, 16);

    expect(compare.candidateState).toBe("COMPARE");
    expect(purchase.candidateState).toBe("PURCHASE_INTENT");
    expect(purchase.candidatePersistence).toBe(1);
    expect(purchase.detectedState).toBe("EXPLORE");
  });

  it("does not accumulate persistence across hysteresis oscillation", () => {
    let result = evaluateTransition(context(), compareDistribution, 15);
    result = advance(result, releaseBoundaryDistribution, 16);
    result = advance(result, compareDistribution, 17);
    result = advance(result, releaseBoundaryDistribution, 18);
    result = advance(result, compareDistribution, 19);

    expect(result.transition).toBeNull();
    expect(result.pendingCandidate).toBe("COMPARE");
    expect(result.candidatePersistence).toBe(1);
  });

  it("resets a two-window candidate when a different candidate appears", () => {
    let result = evaluateTransition(context(), compareDistribution, 15);
    result = advance(result, compareDistribution, 16);
    result = advance(result, purchaseDistribution, 17);

    expect(result.candidateState).toBe("PURCHASE_INTENT");
    expect(result.candidatePersistence).toBe(1);
    expect(result.transition).toBeNull();
    expect(result.detectedState).toBe("EXPLORE");
  });

  it("does not release at the exact 0.20 boundary", () => {
    expect(normalizedL1(releaseBoundaryDistribution, REFERENCE_DISTRIBUTION)).toBeCloseTo(0.2, 12);
    const result = evaluateTransition(context("COMPARE"), releaseBoundaryDistribution, 20);

    expect(result.candidateState).toBe("EXPLORE");
    expect(result.candidatePersistence).toBe(0);
    expect(result.detectedState).toBe("COMPARE");
  });

  it("supports bidirectional state transitions and release below 0.20", () => {
    const compare = play("EXPLORE", compareDistribution);
    const purchase = play("COMPARE", purchaseDistribution);
    const backToCompare = play("PURCHASE_INTENT", compareDistribution);
    const backToExplore = play("COMPARE", REFERENCE_DISTRIBUTION);

    expect(compare.transition?.toState).toBe("COMPARE");
    expect(purchase.transition?.toState).toBe("PURCHASE_INTENT");
    expect(backToCompare.transition?.toState).toBe("COMPARE");
    expect(backToExplore.transition?.toState).toBe("EXPLORE");
  });
});
