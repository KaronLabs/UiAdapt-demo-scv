import { REPLAY_DURATION_MS, REPLAY_EVENTS } from "../domain/replay";
import { createInitialRuntime, runtimeReducer } from "../domain/runtime";
import type { DistributionState, RuntimeSnapshot } from "../domain/types";

export interface StagePresentation {
  timer: string;
  evidence: string;
  changeScore: string;
  reconstructionCount: string;
  signalAt: string;
  signal: string;
  stateLabel: string;
  policyLabel: string;
}

export const STAGE_PRESENTATION = Object.freeze({
  EXPLORE: Object.freeze({
    timer: "00:03",
    evidence: "6 / 15",
    changeScore: "0.08",
    reconstructionCount: "0회",
    signalAt: "3.0s",
    signal: "상품 조회 · Halo Air",
    stateLabel: "탐색",
    policyLabel: "policy: 대기",
  }),
  COMPARE: Object.freeze({
    timer: "00:12",
    evidence: "17 / 15",
    changeScore: "0.41",
    reconstructionCount: "1회",
    signalAt: "11.5s",
    signal: "비교에 추가 · Nova Pro",
    stateLabel: "비교",
    policyLabel: "policy: 적용 · COMPARE",
  }),
  PURCHASE_INTENT: Object.freeze({
    timer: "00:20",
    evidence: "20 / 15",
    changeScore: "0.67",
    reconstructionCount: "2회",
    signalAt: "20.0s",
    signal: "배송 확인 · Aurora One",
    stateLabel: "구매 결정",
    policyLabel: "policy: 적용 · PURCHASE_INTENT",
  }),
}) satisfies Readonly<Record<DistributionState, Readonly<StagePresentation>>>;

function clampElapsedMs(elapsedMs: number): number {
  if (Number.isNaN(elapsedMs)) return 0;
  return Math.min(REPLAY_DURATION_MS, Math.max(0, elapsedMs));
}

export function snapshotAt(elapsedMs: number): RuntimeSnapshot {
  const clampedElapsedMs = clampElapsedMs(elapsedMs);
  let snapshot = createInitialRuntime(true, "stage-replay");
  snapshot = runtimeReducer(snapshot, { type: "RESET_FOR_REPLAY", sessionId: "stage-replay" });

  for (const event of REPLAY_EVENTS) {
    if (event.atMs > clampedElapsedMs) break;
    snapshot = runtimeReducer(snapshot, {
      type: "RECORD_EVENT",
      event,
      epoch: snapshot.sessionEpoch,
    });
  }

  return snapshot;
}
