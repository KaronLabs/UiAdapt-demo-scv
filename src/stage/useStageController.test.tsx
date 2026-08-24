import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStageController } from "./useStageController";

describe("useStageController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays, pauses without drift, resumes, and resets", () => {
    const { result } = renderHook(() => useStageController());

    act(() => result.current.play());
    expect(result.current.playback).toBe("RUNNING");

    act(() => vi.advanceTimersByTime(12_000));
    expect(result.current.elapsedMs).toBe(12_000);
    expect(result.current.snapshot.appliedState).toBe("COMPARE");

    act(() => result.current.pause());
    expect(result.current.playback).toBe("PAUSED");
    act(() => vi.advanceTimersByTime(3_000));
    expect(result.current.elapsedMs).toBe(12_000);

    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(8_000));
    expect(result.current.elapsedMs).toBe(20_000);
    expect(result.current.snapshot.appliedState).toBe("PURCHASE_INTENT");

    act(() => result.current.reset());
    expect(result.current.playback).toBe("IDLE");
    expect(result.current.elapsedMs).toBe(0);
    expect(result.current.snapshot.appliedState).toBe("EXPLORE");
  });

  it("clamps playback at 27 seconds and marks completion", () => {
    const { result } = renderHook(() => useStageController());

    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(30_000));

    expect(result.current.elapsedMs).toBe(27_000);
    expect(result.current.playback).toBe("COMPLETED");
  });

  it.each([
    ["1", 3_000, "EXPLORE"],
    ["2", 12_000, "COMPARE"],
    ["3", 20_000, "PURCHASE_INTENT"],
  ] as const)("maps keyboard %s to its deterministic checkpoint", (key, elapsedMs, state) => {
    const { result } = renderHook(() => useStageController());

    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key })));

    expect(result.current.elapsedMs).toBe(elapsedMs);
    expect(result.current.snapshot.appliedState).toBe(state);
    expect(result.current.playback).toBe("PAUSED");
  });
});
