import type { TelemetryFrame, TelemetrySession, TelemetryStatus } from "../domain/types";

export const TELEMETRY_QUEUE_LIMIT = 128;
export const TELEMETRY_MAX_ATTEMPTS = 3;
export const TELEMETRY_ATTEMPT_TIMEOUT_MS = 1_000;
export const TELEMETRY_BACKOFF_MS = [100, 250] as const;

export interface TelemetryResponse {
  ok: boolean;
  status: number;
}

export type TelemetryFetch = (
  input: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal },
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
  private readonly disabled: boolean;
  private readonly queue: Request[] = [];
  private readonly listeners = new Set<StatusListener>();
  private processing = false;
  private disposed = false;
  private status: TelemetryStatus;
  private idleResolvers: Array<() => void> = [];
  private pendingSession: Request | null = null;

  public constructor(fetchImpl: TelemetryFetch = defaultFetch, options?: { disabled?: boolean }) {
    this.fetchImpl = fetchImpl;
    this.disabled = options?.disabled === true;
    this.status = this.disabled ? "DISABLED" : "HEALTHY";
  }

  public startSession(session: TelemetrySession): boolean {
    if (this.disposed || this.disabled) return false;
    const request = { path: "/api/uiadapt/sessions", body: session };
    if (this.queue.length >= TELEMETRY_QUEUE_LIMIT) {
      this.pendingSession = request;
      this.setStatus("OVERFLOW");
      return true;
    }
    return this.enqueue(request);
  }

  public enqueueTrajectory(frame: TelemetryFrame): boolean {
    if (this.disabled) return false;
    if (this.pendingSession?.body.sessionId === frame.sessionId) return false;
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
    if (this.disposed || this.disabled) return false;
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
        const controller = new AbortController();
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          const response = await Promise.race([
            this.fetchImpl(request.path, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(request.body),
              signal: controller.signal,
            }),
            new Promise<never>((_, reject) => {
              timeout = setTimeout(() => {
                controller.abort();
                reject(new Error("TELEMETRY_TIMEOUT"));
              }, TELEMETRY_ATTEMPT_TIMEOUT_MS);
            }),
          ]);
          if (response.ok) {
            delivered = true;
            break;
          }
        } catch {
          // Telemetry is observational; retry exhaustion is surfaced below.
        } finally {
          if (timeout !== undefined) clearTimeout(timeout);
        }
      }
      this.queue.shift();
      if (this.pendingSession) {
        this.queue.unshift(this.pendingSession);
        this.pendingSession = null;
      }
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

export function createTelemetryClient(fetchImpl?: TelemetryFetch, options?: { disabled?: boolean }): TelemetryClient {
  return new TelemetryClient(fetchImpl, options);
}
