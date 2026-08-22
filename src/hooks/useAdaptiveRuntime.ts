import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createTelemetryClient } from "../api/telemetryClient";
import { classifyBehavior } from "../domain/behaviorTaxonomy";
import { REPLAY_DURATION_MS, REPLAY_EVENTS } from "../domain/replay";
import { createInitialRuntime, runtimeReducer } from "../domain/runtime";
import type {
  BehaviorEvent,
  BehaviorEventType,
  ProductId,
  RuntimeSnapshot,
  TelemetryFrame,
  TelemetrySession,
} from "../domain/types";

let fallbackSessionCounter = 0;

function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  fallbackSessionCounter += 1;
  const suffix = (Date.now() + fallbackSessionCounter).toString(16).slice(-12).padStart(12, "0");
  return `00000000-0000-4000-8000-${suffix}`;
}

function buildTelemetryFrame(
  state: RuntimeSnapshot,
  event: BehaviorEvent,
  transition: RuntimeSnapshot["lastTransition"],
): TelemetryFrame {
  return {
    sessionId: state.sessionId,
    sequenceNo: state.sequenceNo,
    event,
    behaviorDimension: classifyBehavior(event),
    snapshot: {
      eventCount: state.distribution.eventCount,
      windowSize: state.distribution.windowSize,
      counts: state.distribution.counts,
      current: state.distribution.current,
      reference: state.distribution.reference,
      changeScore: state.distribution.changeScore,
      candidateState: state.candidateState,
      candidatePersistence: state.candidatePersistence,
      detectedState: state.detectedState,
      appliedState: state.appliedState,
      adaptiveEnabled: state.adaptiveEnabled,
    },
    transition,
  };
}

function sessionPayload(sessionId: string, source: TelemetrySession["source"], adaptiveEnabled: boolean): TelemetrySession {
  return { sessionId, startedAtMs: Date.now(), source, adaptiveEnabled };
}

export function useAdaptiveRuntime() {
  const [initialSessionId] = useState(createSessionId);
  const [telemetry] = useState(() => createTelemetryClient());
  const [state, dispatch] = useReducer(
    runtimeReducer,
    undefined,
    () => createInitialRuntime(true, initialSessionId),
  );
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

  const acceptEvent = useCallback(
    (event: BehaviorEvent, epoch: number) => {
      const current = stateRef.current;
      const action = { type: "RECORD_EVENT" as const, event, epoch };
      const next = runtimeReducer(current, action);
      if (next.sequenceNo === current.sequenceNo) return;
      dispatch(action);
      const transition = next.transitions.length > current.transitions.length ? next.lastTransition : null;
      telemetry.enqueueTrajectory(buildTelemetryFrame(next, event, transition));
    },
    [telemetry],
  );

  const scheduleFrom = useCallback(
    (elapsedMs: number, epoch: number) => {
      const addTimer = (callback: () => void, delay: number) => {
        const timer = setTimeout(() => {
          timersRef.current.delete(timer);
          callback();
        }, Math.max(0, delay));
        timersRef.current.add(timer);
      };

      for (const event of REPLAY_EVENTS) {
        if (event.atMs <= elapsedMs) continue;
        addTimer(() => acceptEvent(event, epoch), event.atMs - elapsedMs);
      }
      addTimer(
        () => dispatch({ type: "SET_REPLAY_STATUS", status: "COMPLETED", epoch }),
        REPLAY_DURATION_MS - elapsedMs,
      );
    },
    [acceptEvent],
  );

  const startReplay = useCallback(() => {
    clearTimers();
    const current = stateRef.current;
    const sessionId = createSessionId();
    const epoch = current.sessionEpoch + 1;
    replayElapsedRef.current = 0;
    replayStartedAtRef.current = performance.now();
    dispatch({ type: "RESET_FOR_REPLAY", sessionId });
    telemetry.startSession(sessionPayload(sessionId, "REPLAY", current.adaptiveEnabled));
    scheduleFrom(0, epoch);
  }, [clearTimers, scheduleFrom, telemetry]);

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
    const current = stateRef.current;
    const sessionId = createSessionId();
    dispatch({ type: "RESET", sessionId });
    telemetry.startSession(sessionPayload(sessionId, "USER", current.adaptiveEnabled));
  }, [clearTimers, telemetry]);

  const recordUserEvent = useCallback(
    (type: BehaviorEventType, productId: ProductId) => {
      const current = stateRef.current;
      if (current.replayStatus === "RUNNING" || current.replayStatus === "PAUSED") clearTimers();
      manualCounterRef.current += 1;
      const atMs = Math.max(current.lastEventAtMs + 1_000, manualCounterRef.current * 1_000);
      acceptEvent(
        {
          id: `user-${current.sessionEpoch}-${manualCounterRef.current}`,
          atMs,
          type,
          productId,
          source: "USER",
        },
        current.sessionEpoch,
      );
    },
    [acceptEvent, clearTimers],
  );

  const setAdaptiveEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_ADAPTIVE", enabled });
  }, []);

  useEffect(() => {
    const unsubscribe = telemetry.subscribe((status) => {
      dispatch({ type: "SET_TELEMETRY_STATUS", status });
    });
    telemetry.startSession(sessionPayload(stateRef.current.sessionId, "USER", stateRef.current.adaptiveEnabled));
    return () => {
      unsubscribe();
      telemetry.dispose();
    };
  }, [telemetry]);

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
