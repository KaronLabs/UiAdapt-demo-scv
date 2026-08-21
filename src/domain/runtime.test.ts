import { describe, expect, it } from "vitest";
import { PRODUCTS } from "./catalog";
import { REPLAY_EVENTS } from "./replay";
import { createInitialRuntime, deriveFeatures, derivePolicy, runtimeReducer } from "./runtime";
import type { BehaviorEvent, RuntimeSnapshot } from "./types";

function play(events: readonly BehaviorEvent[], adaptiveEnabled = true): RuntimeSnapshot {
  let state = createInitialRuntime(adaptiveEnabled);
  for (const event of events) {
    state = runtimeReducer(state, { type: "RECORD_EVENT", event, epoch: state.sessionEpoch });
  }
  return state;
}

describe("canonical product contract", () => {
  it("keeps the immutable WHAT data exact", () => {
    expect(PRODUCTS).toEqual([
      { id: "aurora-one", name: "Aurora One", price: 329000, rating: 4.8, reviews: 284, batteryHours: 40, anc: "Hybrid ANC", weightGrams: 254, shipping: "내일 무료배송", inventory: 18, colors: ["Graphite", "Sand", "Cobalt"], tagline: "깊은 정숙함, 넓게 열린 사운드.", detail: "정교한 공간감과 장시간 청취를 위한 플래그십 오버이어." },
      { id: "nova-pro", name: "Nova Pro", price: 279000, rating: 4.7, reviews: 198, batteryHours: 36, anc: "Adaptive ANC", weightGrams: 238, shipping: "2일 내 무료배송", inventory: 24, colors: ["Carbon", "Silver"], tagline: "움직임에 맞춰 조율되는 선명함.", detail: "도시의 소음에 반응하는 경량 퍼포먼스 헤드폰." },
      { id: "halo-air", name: "Halo Air", price: 199000, rating: 4.6, reviews: 352, batteryHours: 30, anc: "Standard ANC", weightGrams: 218, shipping: "오늘 출고", inventory: 31, colors: ["Ivory", "Midnight", "Coral"], tagline: "가볍게 쓰고, 오래 듣는 리듬.", detail: "매일의 이동을 위한 가볍고 균형 잡힌 무선 헤드폰." },
    ]);
    expect(Object.isFrozen(PRODUCTS)).toBe(true);
    expect(PRODUCTS.every((product) => Object.isFrozen(product) && Object.isFrozen(product.colors))).toBe(true);
  });
});

describe("deterministic evidence and state policy", () => {
  it("keeps product interaction diagnostics separate from distribution evidence", () => {
    const features = deriveFeatures(REPLAY_EVENTS.slice(0, 4));
    expect(features.windowSize).toBe(4);
    expect(features.interactionsByProduct).toEqual({ "aurora-one": 2, "nova-pro": 1, "halo-air": 1 });
    expect(features.dominantProduct).toBe("aurora-one");
  });

  it("reaches COMPARE and then PURCHASE_INTENT on the canonical replay", () => {
    let state = createInitialRuntime();
    const transitions: string[] = [];
    for (const event of REPLAY_EVENTS) {
      const previous = state.detectedState;
      state = runtimeReducer(state, { type: "RECORD_EVENT", event, epoch: state.sessionEpoch });
      if (state.detectedState !== previous) transitions.push(`${event.atMs}:${state.detectedState}`);
    }
    expect(transitions).toEqual(["11000:COMPARE", "18500:PURCHASE_INTENT"]);
    expect(state.focusedProductId).toBe("aurora-one");
  });

  it("uses identical evidence with Adaptive ON and OFF", () => {
    const on = play(REPLAY_EVENTS, true);
    const off = play(REPLAY_EVENTS, false);
    expect(off.events).toEqual(on.events);
    expect(off.features).toEqual(on.features);
    expect(off.detectedState).toBe("PURCHASE_INTENT");
    expect(off.appliedState).toBe("EXPLORE");
    expect(on.appliedState).toBe("PURCHASE_INTENT");
  });

  it("derives presentation policy without changing detected state", () => {
    const cases = [
      ["EXPLORE", false, { appliedState: "EXPLORE", showComparison: false, focusedProductId: null }],
      ["EXPLORE", true, { appliedState: "EXPLORE", showComparison: false, focusedProductId: null }],
      ["COMPARE", false, { appliedState: "EXPLORE", showComparison: false, focusedProductId: null }],
      ["COMPARE", true, { appliedState: "COMPARE", showComparison: true, focusedProductId: null }],
      ["PURCHASE_INTENT", false, { appliedState: "EXPLORE", showComparison: false, focusedProductId: null }],
      ["PURCHASE_INTENT", true, { appliedState: "PURCHASE_INTENT", showComparison: false, focusedProductId: "aurora-one" }],
    ] as const;
    for (const [state, enabled, expected] of cases) {
      expect(derivePolicy(state, enabled, state === "PURCHASE_INTENT" ? "aurora-one" : null)).toEqual(expected);
    }
  });

  it("keeps ON and OFF evidence sequences identical at every Replay step", () => {
    let on = createInitialRuntime(true);
    let off = createInitialRuntime(false);
    for (const event of REPLAY_EVENTS) {
      on = runtimeReducer(on, { type: "RECORD_EVENT", event, epoch: on.sessionEpoch });
      off = runtimeReducer(off, { type: "RECORD_EVENT", event, epoch: off.sessionEpoch });
      expect(off.events).toEqual(on.events);
      expect(off.features).toEqual(on.features);
      expect(off.detectedState).toBe(on.detectedState);
      expect(off.appliedState).toBe("EXPLORE");
      expect(on.appliedState).toBe(on.detectedState);
    }
  });

  it("produces the same complete evidence and policy sequence over ten runs", () => {
    const signatures = Array.from({ length: 10 }, () => {
      let state = createInitialRuntime();
      return REPLAY_EVENTS.map((event) => {
        state = runtimeReducer(state, { type: "RECORD_EVENT", event, epoch: state.sessionEpoch });
        return {
          event: { atMs: event.atMs, type: event.type, productId: event.productId, source: event.source },
          features: state.features,
          detectedState: state.detectedState,
          policy: derivePolicy(state.detectedState, state.adaptiveEnabled, state.focusedProductId),
          focusedProductId: state.focusedProductId,
          compareTray: state.compareTray,
        };
      });
    });
    expect(signatures).toHaveLength(10);
    for (const signature of signatures.slice(1)) expect(signature).toEqual(signatures[0]);
  });

  it("rejects duplicate, invalid-clock, and stale-epoch events", () => {
    const first = REPLAY_EVENTS[0];
    let state = createInitialRuntime();
    state = runtimeReducer(state, { type: "RECORD_EVENT", event: first, epoch: 0 });
    const acceptedCount = state.events.length;
    state = runtimeReducer(state, { type: "RECORD_EVENT", event: first, epoch: 0 });
    expect(state.events).toHaveLength(acceptedCount);
    expect(state.lastRejectedReason).toBe("DUPLICATE_EVENT_ID");

    state = runtimeReducer(state, {
      type: "RECORD_EVENT",
      event: { ...REPLAY_EVENTS[1], id: "nan-clock", atMs: Number.NaN },
      epoch: 0,
    });
    expect(state.events).toHaveLength(acceptedCount);
    expect(state.lastRejectedReason).toBe("INVALID_EVENT_CLOCK");

    state = runtimeReducer(state, { type: "RESET" });
    state = runtimeReducer(state, { type: "RECORD_EVENT", event: REPLAY_EVENTS[2], epoch: 0 });
    expect(state.events).toHaveLength(0);
    expect(state.lastRejectedReason).toBe("STALE_SESSION_EPOCH");
  });

  it("rejects an unknown product and a non-monotonic event clock", () => {
    const first = REPLAY_EVENTS[0];
    let state = runtimeReducer(createInitialRuntime(), { type: "RECORD_EVENT", event: first, epoch: 0 });

    state = runtimeReducer(state, {
      type: "RECORD_EVENT",
      event: { ...REPLAY_EVENTS[1], id: "unknown-product", productId: "unknown" } as unknown as BehaviorEvent,
      epoch: 0,
    });
    expect(state.events).toHaveLength(1);
    expect(state.lastRejectedReason).toBe("UNKNOWN_PRODUCT_ID");

    state = runtimeReducer(state, {
      type: "RECORD_EVENT",
      event: { ...REPLAY_EVENTS[1], id: "old-clock", atMs: first.atMs - 1 },
      epoch: 0,
    });
    expect(state.events).toHaveLength(1);
    expect(state.lastRejectedReason).toBe("NON_MONOTONIC_EVENT_CLOCK");
  });

  it("rejects an unknown event type before distribution evaluation", () => {
    const state = createInitialRuntime();
    const invalidEvent = {
      ...REPLAY_EVENTS[0],
      id: "unknown-type",
      type: "UNKNOWN_EVENT",
    } as unknown as BehaviorEvent;

    const rejected = runtimeReducer(state, {
      type: "RECORD_EVENT",
      event: invalidEvent,
      epoch: state.sessionEpoch,
    });

    expect(rejected.events).toHaveLength(0);
    expect(rejected.sequenceNo).toBe(0);
    expect(rejected.lastRejectedReason).toBe("UNKNOWN_EVENT_TYPE");
  });

  it("does not enter PURCHASE_INTENT before minimum evidence", () => {
    const events: BehaviorEvent[] = [
      { id: "negative-01", atMs: 1_000, type: "VIEW_PRODUCT", productId: "aurora-one", source: "USER" },
      { id: "negative-02", atMs: 2_000, type: "OPEN_DETAILS", productId: "aurora-one", source: "USER" },
      { id: "negative-03", atMs: 3_000, type: "CHECK_PRICE", productId: "aurora-one", source: "USER" },
      { id: "negative-04", atMs: 4_000, type: "CHECK_REVIEWS", productId: "aurora-one", source: "USER" },
      { id: "negative-05", atMs: 5_000, type: "VIEW_PRODUCT", productId: "aurora-one", source: "USER" },
      { id: "negative-06", atMs: 6_000, type: "OPEN_DETAILS", productId: "aurora-one", source: "USER" },
      { id: "negative-07", atMs: 7_000, type: "SELECT_COLOR", productId: "nova-pro", source: "USER" },
      { id: "negative-08", atMs: 8_000, type: "VIEW_PRODUCT", productId: "nova-pro", source: "USER" },
    ];
    const features = deriveFeatures(events);
    const state = play(events);
    expect(features.dominantProduct).toBe("aurora-one");
    expect(features.interactionsByProduct).toEqual({ "aurora-one": 6, "nova-pro": 2, "halo-air": 0 });
    expect(state.detectedState).not.toBe("PURCHASE_INTENT");
  });

  it("enters PURCHASE_INTENT only after persistent purchase evidence", () => {
    const state = play(REPLAY_EVENTS);
    expect(state.detectedState).toBe("PURCHASE_INTENT");
    expect(state.transitions.map(({ fromState, toState }) => `${fromState}->${toState}`)).toEqual([
      "EXPLORE->COMPARE",
      "COMPARE->PURCHASE_INTENT",
    ]);
  });

  it("stops replay before accepting manual takeover", () => {
    let state = runtimeReducer(createInitialRuntime(), { type: "RESET_FOR_REPLAY" });
    expect(state.replayStatus).toBe("RUNNING");
    state = runtimeReducer(state, {
      type: "RECORD_EVENT",
      event: { ...REPLAY_EVENTS[0], id: "manual-1", source: "USER" },
      epoch: state.sessionEpoch,
    });
    expect(state.replayStatus).toBe("STOPPED_MANUAL_TAKEOVER");
    expect(state.events).toHaveLength(1);
  });
});
