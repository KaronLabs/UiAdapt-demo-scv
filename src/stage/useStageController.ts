import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { REPLAY_DURATION_MS } from "../domain/replay";
import { snapshotAt } from "./stageReplay";

export type StagePlayback = "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED";

const CHECKPOINT_BY_KEY: Readonly<Record<string, number>> = Object.freeze({
  "1": 3_000,
  "2": 12_000,
  "3": 20_000,
});

export function useStageController() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playback, setPlayback] = useState<StagePlayback>("IDLE");
  const elapsedRef = useRef(0);

  const setElapsed = useCallback((nextElapsedMs: number) => {
    elapsedRef.current = nextElapsedMs;
    setElapsedMs(nextElapsedMs);
  }, []);

  useEffect(() => {
    if (playback !== "RUNNING") return undefined;

    const startedAt = performance.now() - elapsedRef.current;
    let frame = 0;
    const update = (now: number) => {
      setElapsed(Math.min(REPLAY_DURATION_MS, Math.round(now - startedAt)));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);

    const checkpoints = [3_000, 12_000, 20_000]
      .filter((checkpoint) => checkpoint > elapsedRef.current)
      .map((checkpoint) => window.setTimeout(
        () => setElapsed(checkpoint),
        checkpoint - elapsedRef.current,
      ));
    const completion = window.setTimeout(() => {
      cancelAnimationFrame(frame);
      setElapsed(REPLAY_DURATION_MS);
      setPlayback("COMPLETED");
    }, REPLAY_DURATION_MS - elapsedRef.current);

    return () => {
      cancelAnimationFrame(frame);
      checkpoints.forEach(clearTimeout);
      clearTimeout(completion);
    };
  }, [playback, setElapsed]);

  const play = useCallback(() => {
    if (playback === "RUNNING") return;
    if (playback === "COMPLETED") setElapsed(0);
    setPlayback("RUNNING");
  }, [playback, setElapsed]);

  const pause = useCallback(() => {
    setPlayback((current) => current === "RUNNING" ? "PAUSED" : current);
  }, []);

  const reset = useCallback(() => {
    setElapsed(0);
    setPlayback("IDLE");
  }, [setElapsed]);

  const jumpTo = useCallback((nextElapsedMs: number) => {
    setElapsed(nextElapsedMs);
    setPlayback("PAUSED");
  }, [setElapsed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const checkpoint = CHECKPOINT_BY_KEY[event.key];
      if (checkpoint !== undefined) jumpTo(checkpoint);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jumpTo]);

  return {
    elapsedMs,
    playback,
    snapshot: useMemo(() => snapshotAt(elapsedMs), [elapsedMs]),
    play,
    pause,
    reset,
    jumpTo,
  };
}
