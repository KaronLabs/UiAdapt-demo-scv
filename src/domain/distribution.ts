import { REFERENCE_DISTRIBUTION, WINDOW_SIZE } from "./behaviorConfig";
import { classifyBehavior } from "./behaviorTaxonomy";
import type { BehaviorDimension, BehaviorEvent, Distribution, DistributionCounts, DistributionEvaluation } from "./types";

const DIMENSIONS: readonly BehaviorDimension[] = ["BROWSE", "DETAIL", "COMPARE", "DECISION", "CART_INTENT"];

function emptyCounts(): DistributionCounts {
  return { BROWSE: 0, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 };
}

function emptyDistribution(): Distribution {
  return { BROWSE: 0, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 };
}

export function normalizedL1(current: Distribution, reference: Distribution): number {
  const distance = DIMENSIONS.reduce(
    (sum, dimension) => sum + Math.abs(current[dimension] - reference[dimension]),
    0,
  );
  return Math.min(1, Math.max(0, distance / 2));
}

export function evaluateDistribution(events: readonly BehaviorEvent[]): DistributionEvaluation {
  const window = events.slice(-WINDOW_SIZE);
  const counts = emptyCounts();

  for (const event of window) counts[classifyBehavior(event)] += 1;

  const current = emptyDistribution();
  if (window.length > 0) {
    for (const dimension of DIMENSIONS) current[dimension] = counts[dimension] / window.length;
  }

  return {
    eventCount: events.length,
    windowSize: window.length,
    counts,
    current,
    reference: { ...REFERENCE_DISTRIBUTION },
    changeScore: window.length === 0 ? 0 : normalizedL1(current, REFERENCE_DISTRIBUTION),
  };
}
