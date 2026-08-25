import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../domain/catalog";
import { snapshotAt, STAGE_PRESENTATION } from "./stageReplay";

const CHECKPOINTS = [
  { elapsedMs: 0, sequenceNo: 0, windowSize: 0, score: 0, state: "EXPLORE", transitions: 0 },
  { elapsedMs: 3_000, sequenceNo: 6, windowSize: 6, score: 0.5, state: "EXPLORE", transitions: 0 },
  { elapsedMs: 12_000, sequenceNo: 23, windowSize: 20, score: 0.45, state: "COMPARE", transitions: 1 },
  { elapsedMs: 20_000, sequenceNo: 40, windowSize: 20, score: 0.7, state: "PURCHASE_INTENT", transitions: 2 },
  { elapsedMs: 27_000, sequenceNo: 48, windowSize: 20, score: 0.85, state: "PURCHASE_INTENT", transitions: 2 },
] as const;

describe("Stage replay model", () => {
  it.each(CHECKPOINTS)(
    "derives the canonical domain snapshot at $elapsedMs ms",
    ({ elapsedMs, sequenceNo, windowSize, score, state, transitions }) => {
      const snapshot = snapshotAt(elapsedMs);

      expect(snapshot.sequenceNo).toBe(sequenceNo);
      expect(snapshot.distribution.eventCount).toBe(sequenceNo);
      expect(snapshot.distribution.windowSize).toBe(windowSize);
      expect(snapshot.distribution.changeScore).toBeCloseTo(score, 10);
      expect(snapshot.detectedState).toBe(state);
      expect(snapshot.transitions).toHaveLength(transitions);
    },
  );

  it("clamps elapsed time to the replay interval", () => {
    expect(snapshotAt(-1)).toEqual(snapshotAt(0));
    expect(snapshotAt(Number.NaN)).toEqual(snapshotAt(0));
    expect(snapshotAt(Number.POSITIVE_INFINITY)).toEqual(snapshotAt(27_000));
    expect(snapshotAt(99_000)).toEqual(snapshotAt(27_000));
  });

  it.each([
    { elapsedMs: 11_999, sequenceNo: 21, state: "EXPLORE" },
    { elapsedMs: 12_000, sequenceNo: 23, state: "COMPARE" },
    { elapsedMs: 19_999, sequenceNo: 36, state: "COMPARE" },
    { elapsedMs: 20_000, sequenceNo: 40, state: "PURCHASE_INTENT" },
  ] as const)(
    "changes state only at the approved $elapsedMs ms Stage boundary",
    ({ elapsedMs, sequenceNo, state }) => {
      const snapshot = snapshotAt(elapsedMs);

      expect(snapshot.sequenceNo).toBe(sequenceNo);
      expect(snapshot.detectedState).toBe(state);
    },
  );

  it("is deterministic and does not mutate the product catalog", () => {
    const catalogBefore = PRODUCTS.map(({ id, price }) => ({ id, price }));

    expect(snapshotAt(20_000)).toEqual(snapshotAt(20_000));
    expect(PRODUCTS.map(({ id, price }) => ({ id, price }))).toEqual(catalogBefore);
  });

  it("keeps approved Expo labels separate from canonical domain evidence", () => {
    expect(STAGE_PRESENTATION).toEqual({
      EXPLORE: {
        timer: "00:03",
        evidence: "6 / 15",
        changeScore: "0.08",
        reconstructionCount: "0회",
        signalAt: "3.0s",
        signal: "상품 조회 · Halo Air",
        stateLabel: "탐색",
        policyLabel: "policy: 대기",
      },
      COMPARE: {
        timer: "00:12",
        evidence: "17 / 15",
        changeScore: "0.41",
        reconstructionCount: "1회",
        signalAt: "11.5s",
        signal: "비교에 추가 · Nova Pro",
        stateLabel: "비교",
        policyLabel: "policy: 적용 · COMPARE",
      },
      PURCHASE_INTENT: {
        timer: "00:20",
        evidence: "20 / 15",
        changeScore: "0.67",
        reconstructionCount: "2회",
        signalAt: "20.0s",
        signal: "배송 확인 · Aurora One",
        stateLabel: "구매 결정",
        policyLabel: "policy: 적용 · PURCHASE_INTENT",
      },
    });
  });
});
