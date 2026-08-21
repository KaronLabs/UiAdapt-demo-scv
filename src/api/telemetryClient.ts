import type { TelemetryFrame, TelemetrySession, TelemetryStatus } from "../domain/types";

export const TELEMETRY_QUEUE_LIMIT = 128;
export const TELEMETRY_MAX_ATTEMPTS = 3;
export const TELEMETRY_BACKOFF_MS = [100, 250, 500] as const;

export interface TelemetryResponse {
  ok: boolean;
  status: number;
}

export type TelemetryFetch = (
  input: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<TelemetryResponse>;

type Request = { path: string; body: TelemetrySession | TelemetryFrame };
type StatusListener = (status: TelemetryStatus) => void;

const defaultFetch: TelemetryFetch = (input, init) => {
  if (typeof fetch !== "function") return Promise.reject(new Error("FETCH_UNAVAILABLE"));
  return fetch(input, init).then((response) => ({ ok: response.ok, status: response.status }));
};

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export class TelemetryClient {
  private readonly fetchImpl: TelemetryFetch;
  private readonly queue: Request[] = [];
  private readonly listeners = new Set<StatusListener>();
  private processing = false;
  private disposed = false;
  private status: TelemetryStatus = "HEALTHY";
  private idleResolvers: Array<() => void> = [];

  public constructor(fetchImpl: TelemetryFetch = defaultFetch) {
    this.fetchImpl = fetchImpl;
  }

  public startSession(session: TelemetrySession): boolean {
    return this.enqueue({ path: "/api/uiadapt/sessions", body: session });
  }

  public enqueueTrajectory(frame: TelemetryFrame): boolean {
    return this.enqueue({ path: "/api/uiadapt/trajectory", body: frame });
  }

  public getStatus(): TelemetryStatus {
    return this.status;
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public whenIdle(): Promise<void> {
    if (!this.processing && this.queue.length === 0) return Promise.resolve();
    return new Promise((resolve) => this.idleResolvers.push(resolve));
  }

  public dispose(): void {
    this.disposed = true;
    this.listeners.clear();
    this.idleResolvers.splice(0).forEach((resolve) => resolve());
  }

  private enqueue(request: Request): boolean {
    if (this.disposed) return false;
    if (this.queue.length >= TELEMETRY_QUEUE_LIMIT) {
      this.setStatus("OVERFLOW");
      return false;
    }
    this.queue.push(request);
    void this.processQueue();
    return true;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.disposed) return;
    this.processing = true;
    while (this.queue.length > 0 && !this.disposed) {
      const request = this.queue[0];
      let delivered = false;
      for (let attempt = 0; attempt < TELEMETRY_MAX_ATTEMPTS; attempt += 1) {
        if (attempt > 0) await wait(TELEMETRY_BACKOFF_MS[attempt - 1]);
        try {
          const response = await this.fetchImpl(request.path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request.body),
          });
          if (response.ok) {
            delivered = true;
            break;
          }
        } catch {
          // Telemetry is observational; retry exhaustion is surfaced below.
        }
      }
      this.queue.shift();
      if (!delivered) this.setStatus("DEGRADED");
      else if (this.status !== "OVERFLOW") this.setStatus("HEALTHY");
    }
    this.processing = false;
    this.idleResolvers.splice(0).forEach((resolve) => resolve());
  }

  private setStatus(status: TelemetryStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.listeners) listener(status);
  }
}

export function createTelemetryClient(fetchImpl?: TelemetryFetch): TelemetryClient {
  return new TelemetryClient(fetchImpl);
}
