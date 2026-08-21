import { afterEach, describe, expect, it, vi } from "vitest";
import { createTelemetryClient } from "./telemetryClient";
import type { TelemetryFrame, TelemetrySession } from "../domain/types";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

function session(): TelemetrySession {
  return {
    sessionId: SESSION_ID,
    startedAtMs: 1_000,
    source: "REPLAY",
    adaptiveEnabled: true,
  };
}

function frame(sequenceNo: number): TelemetryFrame {
  return {
    sessionId: SESSION_ID,
    sequenceNo,
    event: {
      id: `event-${sequenceNo}`,
      atMs: sequenceNo * 500,
      type: "VIEW_PRODUCT",
      productId: "aurora-one",
      source: "REPLAY",
    },
    behaviorDimension: "BROWSE",
    snapshot: {
      eventCount: sequenceNo,
      windowSize: 1,
      counts: { BROWSE: 1, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 },
      current: { BROWSE: 1, DETAIL: 0, COMPARE: 0, DECISION: 0, CART_INTENT: 0 },
      reference: { BROWSE: 0.5, DETAIL: 0.2, COMPARE: 0.15, DECISION: 0.1, CART_INTENT: 0.05 },
      changeScore: 0.5,
      candidateState: "EXPLORE",
      candidatePersistence: 0,
      detectedState: "EXPLORE",
      appliedState: "EXPLORE",
    },
    transition: null,
  };
}

function okResponse(): Promise<{ ok: true; status: 200 }> {
  return Promise.resolve({ ok: true, status: 200 });
}

afterEach(() => vi.useRealTimers());

describe("bounded telemetry client", () => {
  it("serializes session and trajectory frames in FIFO order", async () => {
    const bodies: unknown[] = [];
    const fetchImpl = vi.fn(async (_input: string, init?: { body?: string }) => {
      bodies.push(JSON.parse(init?.body ?? "{}"));
      return okResponse();
    });
    const client = createTelemetryClient(fetchImpl);

    expect(client.startSession(session())).toBe(true);
    expect(client.enqueueTrajectory(frame(1))).toBe(true);
    expect(client.enqueueTrajectory(frame(2))).toBe(true);
    await client.whenIdle();

    expect(fetchImpl.mock.calls.map(([input]) => input)).toEqual([
      "/api/uiadapt/sessions",
      "/api/uiadapt/trajectory",
      "/api/uiadapt/trajectory",
    ]);
    expect(bodies.map((body) => "sequenceNo" in (body as object) ? (body as { sequenceNo: number }).sequenceNo : 0)).toEqual([0, 1, 2]);
    client.dispose();
  });

  it("rejects the new frame at capacity without silently dropping the oldest", () => {
    const fetchImpl = vi.fn(() => new Promise<never>(() => undefined));
    const client = createTelemetryClient(fetchImpl);

    for (let sequenceNo = 1; sequenceNo <= 128; sequenceNo += 1) {
      expect(client.enqueueTrajectory(frame(sequenceNo))).toBe(true);
    }
    expect(client.enqueueTrajectory(frame(129))).toBe(false);
    expect(client.getStatus()).toBe("OVERFLOW");
    client.dispose();
  });

  it("stops after three attempts and exposes DEGRADED", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 503 }));
    const client = createTelemetryClient(fetchImpl);

    expect(client.enqueueTrajectory(frame(1))).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(250);
    await client.whenIdle();

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(client.getStatus()).toBe("DEGRADED");
    client.dispose();
  });
});
