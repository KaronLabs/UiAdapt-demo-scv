import { useCallback, useEffect, useReducer, useRef } from "react";
import { REPLAY_DURATION_MS, REPLAY_EVENTS } from "../domain/replay";
import { createInitialRuntime, runtimeReducer } from "../domain/runtime";
import type { BehaviorEventType, ProductId } from "../domain/types";

export function useAdaptiveRuntime() {
  const [state, dispatch] = useReducer(runtimeReducer, undefined, () => createInitialRuntime(true));
  const stateRef = useRef(state);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const replayElapsedRef = useRef(0);
  const replayStartedAtRef = useRef(0);
  const manualCounterRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer);
    timersRef.current.clear();
  }, []);

  const scheduleFrom = useCallback((elapsedMs: number, epoch: number) => {
    const addTimer = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timersRef.current.delete(timer);
        callback();
      }, Math.max(0, delay));
      timersRef.current.add(timer);
    };

    for (const event of REPLAY_EVENTS) {
      if (event.atMs <= elapsedMs) continue;
      addTimer(
        () => dispatch({ type: "RECORD_EVENT", event, epoch }),
        event.atMs - elapsedMs,
      );
    }
    addTimer(
      () => dispatch({ type: "SET_REPLAY_STATUS", status: "COMPLETED", epoch }),
      REPLAY_DURATION_MS - elapsedMs,
    );
  }, []);

  const startReplay = useCallback(() => {
    clearTimers();
    const epoch = stateRef.current.sessionEpoch + 1;
    replayElapsedRef.current = 0;
    replayStartedAtRef.current = performance.now();
    dispatch({ type: "RESET_FOR_REPLAY" });
    scheduleFrom(0, epoch);
  }, [clearTimers, scheduleFrom]);

  const pauseReplay = useCallback(() => {
    const current = stateRef.current;
    if (current.replayStatus !== "RUNNING") return;
    replayElapsedRef.current = Math.min(
      REPLAY_DURATION_MS,
      replayElapsedRef.current + performance.now() - replayStartedAtRef.current,
    );
    clearTimers();
    dispatch({ type: "SET_REPLAY_STATUS", status: "PAUSED", epoch: current.sessionEpoch });
  }, [clearTimers]);

  const resumeReplay = useCallback(() => {
    const current = stateRef.current;
    if (current.replayStatus !== "PAUSED") return;
    replayStartedAtRef.current = performance.now();
    dispatch({ type: "SET_REPLAY_STATUS", status: "RUNNING", epoch: current.sessionEpoch });
    scheduleFrom(replayElapsedRef.current, current.sessionEpoch);
  }, [scheduleFrom]);

  const stopReplay = useCallback(() => {
    const current = stateRef.current;
    if (current.replayStatus !== "RUNNING" && current.replayStatus !== "PAUSED") return;
    clearTimers();
    dispatch({ type: "SET_REPLAY_STATUS", status: "STOPPED", epoch: current.sessionEpoch });
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    replayElapsedRef.current = 0;
    dispatch({ type: "RESET" });
  }, [clearTimers]);

  const recordUserEvent = useCallback(
    (type: BehaviorEventType, productId: ProductId) => {
      const current = stateRef.current;
      if (current.replayStatus === "RUNNING" || current.replayStatus === "PAUSED") clearTimers();
      manualCounterRef.current += 1;
      const atMs = Math.max(current.lastEventAtMs + 1_000, manualCounterRef.current * 1_000);
      dispatch({
        type: "RECORD_EVENT",
        epoch: current.sessionEpoch,
        event: {
          id: `user-${current.sessionEpoch}-${manualCounterRef.current}`,
          atMs,
          type,
          productId,
          source: "USER",
        },
      });
    },
    [clearTimers],
  );

  const setAdaptiveEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_ADAPTIVE", enabled });
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    state,
    startReplay,
    pauseReplay,
    resumeReplay,
    stopReplay,
    reset,
    recordUserEvent,
    setAdaptiveEnabled,
  };
}
