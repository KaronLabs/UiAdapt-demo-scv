import {
  ENTER_THRESHOLD,
  MINIMUM_EVIDENCE,
  RELEASE_THRESHOLD,
  REQUIRED_PERSISTENCE,
  REFERENCE_DISTRIBUTION,
} from "./behaviorConfig";
import { normalizedL1 } from "./distribution";
import type { Distribution, DistributionState } from "./types";

export interface TransitionContext {
  detectedState: DistributionState;
  pendingCandidate: DistributionState | null;
  candidatePersistence: number;
}

export interface TransitionRecord {
  fromState: DistributionState;
  toState: DistributionState;
  changeScore: number;
  persistenceCount: number;
}

export interface TransitionEvaluation {
  candidateState: DistributionState;
  candidatePersistence: number;
  pendingCandidate: DistributionState | null;
  detectedState: DistributionState;
  changeScore: number;
  transition: TransitionRecord | null;
}

export function candidateFor(distribution: Distribution): DistributionState {
  if (distribution.DECISION + distribution.CART_INTENT >= 0.6 && distribution.CART_INTENT >= 0.1) {
    return "PURCHASE_INTENT";
  }
  if (distribution.COMPARE >= 0.35) return "COMPARE";
  return "EXPLORE";
}

export function evaluateTransition(
  context: TransitionContext,
  distribution: Distribution,
  eventCount: number,
): TransitionEvaluation {
  const candidateState = candidateFor(distribution);
  const changeScore = normalizedL1(distribution, REFERENCE_DISTRIBUTION);
  const base = {
    candidateState,
    detectedState: context.detectedState,
    changeScore,
    transition: null,
  } satisfies Omit<TransitionEvaluation, "candidatePersistence" | "pendingCandidate">;

  if (eventCount < MINIMUM_EVIDENCE || candidateState === context.detectedState) {
    return { ...base, candidatePersistence: 0, pendingCandidate: null };
  }

  const scorePasses = candidateState === "EXPLORE"
    ? changeScore < RELEASE_THRESHOLD
    : changeScore >= ENTER_THRESHOLD;
  if (!scorePasses) return { ...base, candidatePersistence: 0, pendingCandidate: null };

  const candidatePersistence = context.pendingCandidate === candidateState
    ? context.candidatePersistence + 1
    : 1;
  if (candidatePersistence < REQUIRED_PERSISTENCE) {
    return { ...base, candidatePersistence, pendingCandidate: candidateState };
  }

  return {
    ...base,
    candidatePersistence: 0,
    pendingCandidate: null,
    detectedState: candidateState,
    transition: {
      fromState: context.detectedState,
      toState: candidateState,
      changeScore,
      persistenceCount: candidatePersistence,
    },
  };
}
