import { describe, expect, it } from "vitest";
import { REPLAY_DURATION_MS, REPLAY_EVENTS } from "./replay";
import { createInitialRuntime, runtimeReducer } from "./runtime";
import type { RuntimeSnapshot } from "./types";

function play(events = REPLAY_EVENTS, adaptiveEnabled = true, sessionId = "session-test"): RuntimeSnapshot {
  let state = createInitialRuntime(adaptiveEnabled, sessionId);
  state = runtimeReducer(state, { type: "RESET_FOR_REPLAY", sessionId });
  for (const event of events) {
    state = runtimeReducer(state, { type: "RECORD_EVENT", event, epoch: state.sessionEpoch });
  }
  return state;
}

describe("distribution replay integration", () => {
  it("uses 48 raw events to reach both states without direct state injection", () => {
    const state = play();

    expect(REPLAY_DURATION_MS).toBe(27_000);
    expect(REPLAY_EVENTS).toHaveLength(48);
    expect(REPLAY_EVENTS.some((event) => event.type === ("SET_STATE" as never))).toBe(false);
    expect(state.transitions.map(({ fromState, toState }) => `${fromState}->${toState}`)).toEqual([
      "EXPLORE->COMPARE",
      "COMPARE->PURCHASE_INTENT",
    ]);
    expect(state.detectedState).toBe("PURCHASE_INTENT");
    expect(state.events).toHaveLength(48);
  });

  it("keeps Adaptive OFF evidence identical while applying EXPLORE", () => {
    const on = play(REPLAY_EVENTS, true, "session-on");
    const off = play(REPLAY_EVENTS, false, "session-off");

    expect(off.events).toEqual(on.events);
    expect(off.distribution).toEqual(on.distribution);
    expect(off.detectedState).toBe("PURCHASE_INTENT");
    expect(off.appliedState).toBe("EXPLORE");
    expect(on.appliedState).toBe("PURCHASE_INTENT");
  });

  it("restores the detected product focus when Adaptive UI is re-enabled", () => {
    const detectedWhileOff = play(REPLAY_EVENTS, false, "session-off-on");
    const reEnabled = runtimeReducer(detectedWhileOff, { type: "SET_ADAPTIVE", enabled: true });

    expect(detectedWhileOff.detectedState).toBe("PURCHASE_INTENT");
    expect(reEnabled.appliedState).toBe("PURCHASE_INTENT");
    expect(reEnabled.focusedProductId).toBe("aurora-one");
  });

  it("creates a new session on reset and rejects the old epoch", () => {
    const initial = play(REPLAY_EVENTS.slice(0, 1));
    const reset = runtimeReducer(initial, { type: "RESET", sessionId: "session-reset" });
    const stale = runtimeReducer(reset, {
      type: "RECORD_EVENT",
      event: REPLAY_EVENTS[1],
      epoch: initial.sessionEpoch,
    });

    expect(reset.sessionId).toBe("session-reset");
    expect(reset.sessionEpoch).toBe(initial.sessionEpoch + 1);
    expect(reset.events).toHaveLength(0);
    expect(stale.lastRejectedReason).toBe("STALE_SESSION_EPOCH");
  });
});
