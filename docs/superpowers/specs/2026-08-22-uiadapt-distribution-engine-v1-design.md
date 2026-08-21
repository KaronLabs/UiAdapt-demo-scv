# UIAdapt Distribution Engine v1 + Persistent Demo Telemetry

**Date:** 2026-08-22

**Status:** Approved source-design baseline for implementation on `codex/uiadapt-distribution-engine-v1`

**Base source:** `a0c701d6a9f8737e787e607106da87185bf19319`

**Scope:** Build a source-level R9 candidate while preserving the R8 UI, release files, and live environment.

## 1. Goal

Replace the current product-switch heuristic with a deterministic behavior-distribution engine and record its complete trajectory in a disposable MySQL 8 integration environment. The runtime must make this causal chain inspectable:

```text
Raw event
→ behavior dimension
→ last 20 events
→ current distribution
→ normalized L1 change score
→ evidence/persistence/hysteresis gate
→ detected state
→ presentation policy
→ UI
```

The browser remains the only state-decision authority. MySQL records the decision inputs and outputs; it never calculates or overrides an adaptive state.

## 2. Provenance and baseline

The Grafana repository at `E:\03_AllWork\grafana` is an evidence workspace with unrelated dirty files and is not the application repository. The application repository is the nested Git repository at `E:\03_AllWork\grafana\park-web-demo`.

The R8 live source is preserved in `E:\03_AllWork\uiadapt-r8-readiness-remediation` at `a0c701d6a9f8737e787e607106da87185bf19319`. This design and all implementation are isolated in `E:\03_AllWork\uiadapt-distribution-engine-v1` on branch `codex/uiadapt-distribution-engine-v1`.

The fresh baseline from that exact SHA is:

| Gate | Result |
|---|---:|
| `npm run lint` | RC 0 |
| `npm test` | 19/19 |
| `npm run test:gateway` | 16/16 |
| `npm run test:deployment` | 18/18 |
| `npm run verify:build-bases` | RC 0 |
| `npm run build` | RC 0 |
| `npm run build:nwg` | RC 0 |
| `npm run test:e2e` | 48/48 |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| `git diff --check` | RC 0 |

The local Windows host has no `mysql`, `mysqld`, or MySQL service. MySQL server availability is therefore `unavailable` locally; no package installation, service start, database creation, or live provisioning is allowed. The integration gate must run in GitHub Actions using a disposable MySQL 8 service container.

## 3. Chosen approach

### A. Browser memory only

This would be the smallest change, but it cannot provide durable sessions, event trajectory evidence, or duplicate-safe persistence. It does not satisfy the mission.

### B. Pure browser engine plus MySQL telemetry — selected

The domain engine stays pure TypeScript and deterministic. A same-origin Node API persists session, event, distribution, and transition records in MySQL. The UI remains responsive and correct when the API is unavailable because telemetry is observational, not authoritative.

### C. Server-authoritative engine

This would move the decision boundary across the network and require server session state, latency semantics, and a second implementation of the reducer. It is explicitly outside Demo v1.

## 4. Invariants and non-goals

The following remain unchanged:

- R8 visual hierarchy, product catalog, product IDs, prices, ratings, reviews, shipping, inventory, colors, taglines, and details.
- Local Wanted Sans and IBM Plex Mono assets.
- Nested `/uiadapt_demo/` build base and existing static/gateway deployment contracts.
- 27-second replay controls: Pause, Resume, Stop, Reset, and manual takeover.
- Adaptive OFF causal behavior: detected state continues to advance while applied presentation remains `EXPLORE`.
- Basic Auth, static upstream, release pointer, Funnel mappings, and live services.

The following are not built:

- Live R8 mutation or R9 deployment.
- `main` merge.
- Live MySQL database/user provisioning or package installation.
- Public port 3306, real checkout, completed-purchase events, PII collection, ML/LLM classification, Kafka, Redis, multi-tenancy, historical personalization, retention scheduling, or policy administration.
- New search, filter, payment, or full-page redesign features.

`PURCHASE_INTENT` is an interaction state, not a completed purchase and not a claim about conversion probability.

## 5. Domain model

### 5.1 Types

`src/domain/types.ts` remains the shared type boundary. The new types are:

```ts
export type AdaptiveState = "EXPLORE" | "COMPARE" | "PURCHASE_INTENT";
export type BehaviorDimension = "BROWSE" | "DETAIL" | "COMPARE" | "DECISION" | "CART_INTENT";

export interface Distribution {
  BROWSE: number;
  DETAIL: number;
  COMPARE: number;
  DECISION: number;
  CART_INTENT: number;
}

export interface DistributionSnapshot {
  sequenceNo: number;
  eventCount: number;
  windowSize: number;
  counts: Record<BehaviorDimension, number>;
  current: Distribution;
  reference: Distribution;
  changeScore: number;
  candidateState: AdaptiveState;
  candidatePersistence: number;
  detectedState: AdaptiveState;
  appliedState: AdaptiveState;
}

export interface TransitionRecord {
  sequenceNo: number;
  fromState: AdaptiveState;
  toState: AdaptiveState;
  changeScore: number;
  persistenceCount: number;
}
```

`BehaviorEvent` continues to carry `id`, `atMs`, `type`, `productId`, and `source`. An accepted event is paired with `sessionId`, `sequenceNo`, and its single `behaviorDimension` in the runtime/telemetry frame. One raw event maps to exactly one dimension; an unknown event type is rejected before state evaluation.

The runtime stores all accepted event records needed by the existing UI and telemetry, but every distribution calculation consumes only the last 20 records. The calculation work and retained decision window are therefore bounded by a constant of 20 events.

### 5.2 Behavior taxonomy

`src/domain/behaviorTaxonomy.ts` is the only raw-event mapping source:

| Raw event type | Dimension |
|---|---|
| `VIEW_PRODUCT` | `BROWSE` |
| `OPEN_DETAILS` | `DETAIL` |
| `ADD_COMPARE`, `REMOVE_COMPARE` | `COMPARE` |
| `CHECK_PRICE`, `CHECK_REVIEWS`, `SELECT_COLOR`, `CHECK_SHIPPING` | `DECISION` |
| `ADD_TO_CART` | `CART_INTENT` |

The mapping is a total function over the current `BehaviorEventType` union. It does not inspect product values and does not mutate the catalog.

### 5.3 Reference distribution and math

`src/domain/behaviorConfig.ts` owns the v1 tuning constants:

```text
reference = {
  BROWSE: 0.50,
  DETAIL: 0.20,
  COMPARE: 0.15,
  DECISION: 0.10,
  CART_INTENT: 0.05
}
windowSize = 20
minimumEvidence = 15
enterThreshold = 0.30
releaseThreshold = 0.20
requiredPersistence = 3
```

For a non-empty window, counts are divided by the window size and must sum to `1 ± 1e-9`. Empty input returns all-zero probabilities, `eventCount=0`, and `changeScore=0`; it cannot transition.

The normalized L1 score is:

```text
changeScore = clamp(sum(abs(current[d] - reference[d])) / 2, 0, 1)
```

The divisor 2 is the maximum L1 distance between two probability distributions. Identical distributions therefore score 0 and disjoint distributions score 1. State thresholds use the unrounded `number`; UI may format the value to two decimals for display.

### 5.4 Candidate and transition engine

`src/domain/transitionEngine.ts` owns candidate selection and persistence. It has no React or MySQL imports.

Candidate selection is deterministic:

1. `PURCHASE_INTENT` when `DECISION + CART_INTENT >= 0.60` and `CART_INTENT >= 0.10`.
2. Otherwise `COMPARE` when `COMPARE >= 0.35`.
3. Otherwise `EXPLORE`.

The score/evidence gate is applied after candidate selection:

- No state change is possible while `eventCount < 15`.
- A non-`EXPLORE` candidate requires `changeScore >= 0.30`.
- An `EXPLORE` release candidate requires `changeScore < 0.20`.
- A candidate different from the current state starts persistence at 1. The same candidate on the next two eligible evaluations increments to 2 and 3. A candidate flip resets persistence to 1.
- Transition occurs only when persistence reaches 3. The pending candidate is cleared after transition.
- The same rules work in both directions; there is no old monotonic state rank.

The engine returns the candidate, persistence, detected state, and optional transition record on every accepted event so the Developer View and telemetry can show the causal evidence.

## 6. Policy and runtime

`src/domain/policy.ts` is the only presentation transformation boundary:

```text
detectedState + adaptiveEnabled + focusedProductId → PresentationPolicy
```

`COMPARE` applies the existing comparison surface. `PURCHASE_INTENT` applies the existing decision-support surface and focuses the dominant product. `EXPLORE` is the baseline presentation. With Adaptive OFF, `detectedState` and all distribution evidence remain unchanged while `appliedState` is forced to `EXPLORE`.

`src/domain/runtime.ts` composes taxonomy, distribution, transition, and policy. It remains pure. It rejects stale session epochs, invalid clocks, unknown products, duplicate event IDs, and non-monotonic event clocks before changing state. The runtime adds:

- `sessionId` and monotonically increasing `sequenceNo`.
- The latest `DistributionSnapshot`.
- An optional `lastTransition` and transition history needed by the UI frame.
- A telemetry status that is observational only: `HEALTHY`, `DEGRADED`, or `OVERFLOW`.

Reset and Start Replay create a new session ID and increment the epoch. Existing session history is never deleted. The reducer does not call UUID or network APIs; the hook supplies session IDs and telemetry side effects.

## 7. Canonical replay

`src/domain/replay.ts` keeps `REPLAY_DURATION_MS = 27_000` and supplies 48 deterministic raw events at 500 ms intervals. It does not contain `SET_STATE`, state labels, or any equivalent direct state injection.

The fixture phases are:

| Event range | Dimension shape | Purpose |
|---|---|---|
| 1–14 | 7 BROWSE, 4 DETAIL, 3 COMPARE | Baseline-like exploration; evidence is below the minimum and score remains below enter threshold |
| 15–23 | COMPARE-heavy | At events 20–22, evidence is at least 15, score is at least 0.30, and COMPARE persistence reaches 3 |
| 24–37 | DECISION/CART_INTENT-heavy | At events 35–37, purchase intent reaches the same evidence/persistence gate |
| 38–48 | DECISION/CART_INTENT continuation | Keeps the final state stable through replay completion |

The expected domain transition sequence is `EXPLORE → COMPARE → PURCHASE_INTENT`. Pause/Resume operates on virtual elapsed time; Stop preserves the current snapshot and cancels pending timers; Reset creates a new session and clears event/window state; a user event during replay cancels remaining replay timers and becomes a `USER` event.

## 8. Telemetry persistence

### 8.1 Database schema

`db/001-uiadapt-demo.sql` creates exactly four InnoDB `utf8mb4` tables in database `uiadapt_demo`:

1. `uiadapt_sessions`: `session_id` primary key, start/end timestamps, replay/manual source, and adaptive-enabled flag.
2. `uiadapt_events`: `(session_id, sequence_no)` primary key, unique `(session_id, event_id)`, raw event fields, and one behavior dimension.
3. `uiadapt_distribution_snapshots`: `(session_id, sequence_no)` primary key, window/evidence counts, five probabilities, reference score, candidate, persistence, detected state, and applied state.
4. `uiadapt_transitions`: unique transition identity per session/trigger sequence, from/to state, raw change score, and persistence count.

No table stores IP, User-Agent, email, name, authentication credential, or arbitrary request payload. All foreign keys use the session ID and all state/event columns use constrained values. No trigger, stored procedure, or SQL expression calculates adaptive state.

### 8.2 Node API

`server/db.mjs` creates a `mysql2/promise` pool with parameterized queries and a transaction helper. `server/validation.mjs` validates JSON body size, content type, UUID/session IDs, sequence numbers, event enums, product IDs, dimensions, states, probability ranges, and finite numeric scores. `server/uiadapt-api.mjs` exposes:

| Method | Path | Semantics |
|---|---|---|
| `GET` | `/api/uiadapt/health` | `200 {status:"ok"}` when `SELECT 1` succeeds; `503 {status:"unhealthy"}` otherwise |
| `POST` | `/api/uiadapt/sessions` | Idempotently creates a session; conflicting session metadata is `409` |
| `POST` | `/api/uiadapt/trajectory` | Transactionally inserts event + snapshot + optional transition; exact retry is `200` duplicate, conflict is `409` |
| `GET` | `/api/uiadapt/sessions/:sessionId/trajectory` | Returns ordered, secret-free trajectory rows for Developer View/tests |

The trajectory transaction locks the session identity, detects exact duplicates before insertion, inserts all correlated records, and rolls back every record if any insert fails. The API uses a fixed local database connection and never acts as a general proxy. Missing credential at startup fails closed. A reachable API with an unavailable MySQL server remains available for `health` and reports `503`; it does not alter browser decisions.

### 8.3 Browser telemetry client

`src/api/telemetryClient.ts` sends same-origin requests only. It owns a FIFO queue with:

```text
maximum queued frames: 128
maximum attempts per frame: 3
backoff: 100 ms, 250 ms, 500 ms
```

The queue never silently drops the oldest frame. When full, the new frame is rejected and status becomes `OVERFLOW`; the runtime still accepts the user event and the Developer View exposes the loss boundary. Network/API failures retain the frame until retry exhaustion, then mark `DEGRADED` and continue the local engine. A queue worker serializes requests so session sequence order is preserved.

## 9. Gateway and operations

`scripts/password-gateway.mjs` keeps the existing Basic Auth boundary and adds a fixed API upstream:

```text
/api/uiadapt or /api/uiadapt/* → http://127.0.0.1:4181
everything else                 → http://127.0.0.1:5173
```

The incoming request URL cannot select an upstream host or port. Authentication is checked before either upstream is contacted, and `Authorization` is removed before forwarding. HTTP and WebSocket paths share the same fixed route selection. Existing root redirect, malformed-target, absolute-form, and SSRF protections remain.

`deploy/systemd/uiadapt-api.service` binds only to `127.0.0.1:4181`, reads the MySQL credential through `LoadCredential`, and uses the fixed database/user contract. The gateway unit gains the API upstream environment and a non-public API service dependency without changing Funnel 443/8443/8787 mappings. Deployment tests continue to use temporary roots and dynamic ports; they never stage or delete the real project `www` tree.

## 10. CI and verification

The workflow retains Node 22/24 gateway/deployment checks and adds an `api-integration` job with a disposable MySQL 8 service container. CI supplies temporary credentials through job environment variables/secrets; no credential is written to repository files, command arguments, logs, screenshots, or evidence. The exact feature SHA must pass:

```text
npm run lint
npm test
npm run test:gateway
npm run test:deployment
npm run verify:build-bases
npm run build
npm run build:nwg
npm run test:api-integration
npm run test:e2e
npm audit --omit=dev --audit-level=high
git diff --check "$BASE_SHA...$HEAD_SHA" -- . ':(exclude)evidence/**'
```

The diff gate covers the feature source, documentation, and workflow changes. The
tracked `evidence/**` tree is excluded because its raw streams are sealed evidence
bytes and are verified by their own manifests rather than rewritten for whitespace.

The browser E2E perimeter is extended without redesigning the page. It proves the 27-second causal sequence, Developer View distribution/evidence, Adaptive OFF divergence between detected/applied state, product invariants, API degraded behavior, nested assets, keyboard behavior, and zero unintended external requests.

## 11. TDD and evidence gates

Implementation proceeds in six bounded iterations. Each production function is preceded by a focused failing test and a recorded expected RED result. A GREEN run follows the smallest implementation, then the relevant regression suite. The baseline remains separately recorded at the exact source SHA.

The implementation worker stops at `READY_FOR_INDEPENDENT_REVIEW`; it does not call its own fresh verification independent. A separate review phase checks source/diff, duplicate algorithm paths, test coverage, secrets, live non-mutation, and replay causality. Final verification is a fresh command set after implementation and review findings are resolved.

Evidence is append-only. It records command, timestamp, exit code, exact HEAD, changed-file inventory, test counts, CI URL/artifact, review findings, and unresolved risks. Failed RED attempts are retained; they are never overwritten by GREEN output.

## 12. Acceptance and failure criteria

`SOURCE_READY_FOR_DEPLOYMENT_REVIEW` is allowed only when all of these are proven on the feature SHA:

- Domain flow implements 20-window, five dimensions, normalized L1, evidence 15, enter/release hysteresis, persistence 3, and bidirectional states.
- Replay has 48 deterministic raw events, remains 27 seconds, and reaches both transitions without direct state injection.
- Adaptive OFF preserves detected evidence and applies `EXPLORE` presentation.
- Four MySQL tables, transaction/idempotency behavior, loopback API, bounded queue, and degraded semantics are tested.
- Gateway routes API/static by fixed path, rejects unauthenticated upstream access, and strips Authorization.
- Existing R8 product/UI/deployment contracts pass their regression tests.
- Exact-head CI, independent review, fresh verification, and `git diff --check` are successful.
- Live mutation, live MySQL provisioning, main merge, Funnel changes, and secret exposure are all false.

Any live mutation, direct replay state injection, duplicate adaptive algorithm, SQL interpolation, secret exposure, product invariant break, API-induced state change, hidden failed test, or unresolved Critical/Important review finding is an automatic failure. The maximum status for this mission is `SOURCE_READY_FOR_DEPLOYMENT_REVIEW`; `LIVE_DEPLOYED` is forbidden.
