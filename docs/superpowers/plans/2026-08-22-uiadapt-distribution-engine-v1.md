# UIAdapt Distribution Engine v1 Implementation Plan

> For agentic workers: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

Goal: Replace the R8 eight-event heuristic with a pure 20-event behavior-distribution engine and durable, idempotent MySQL telemetry while preserving the R8 UI and live boundaries.

Architecture: The browser reducer is the only adaptive decision authority. Pure TypeScript modules map events, calculate a bounded distribution and normalized L1 score, gate transitions with evidence/persistence/hysteresis, and pass the result through Policy. A loopback Node API persists frames to four MySQL tables; a same-origin gateway routes only /api/uiadapt/* to that API.

Tech Stack: React 19, TypeScript 6, Vite 8, Vitest 4, Testing Library, Playwright 1.62, Node ESM, mysql2/promise, MySQL 8 service container, systemd source units.

Base: a0c701d6a9f8737e787e607106da87185bf19319
Worktree: E:/03_AllWork/uiadapt-distribution-engine-v1
Branch: codex/uiadapt-distribution-engine-v1
Design spec: docs/superpowers/specs/2026-08-22-uiadapt-distribution-engine-v1-design.md

---

## Execution rules

- Work only in the feature worktree. Do not edit the Grafana evidence workspace, the R8 live worktree, or existing evidence worktrees.
- Do not edit main, change live services, provision MySQL, change Funnel mappings, or write credentials.
- Use explicit git add paths; never use broad staging commands.
- Every production behavior change follows RED test, expected failure record, smallest GREEN implementation, and focused regression.
- The implementation worker stops at READY_FOR_INDEPENDENT_REVIEW. Independent review and fresh verification are separate phases.
- Failed RED output and later GREEN output remain separate append-only evidence records.

## File responsibility map

| File | Responsibility |
|---|---|
| src/domain/types.ts | Shared event, state, distribution, runtime, and telemetry-frame types |
| src/domain/behaviorConfig.ts | Five dimensions, reference distribution, window, threshold, persistence constants |
| src/domain/behaviorTaxonomy.ts | Total raw event to one dimension mapping |
| src/domain/distribution.ts | Last-20 window, counts, probabilities, normalized L1 |
| src/domain/transitionEngine.ts | Candidate, evidence, persistence, hysteresis, transition record |
| src/domain/policy.ts | Detected state plus Adaptive ON/OFF to presentation policy |
| src/domain/runtime.ts | Pure reducer composition and clock/epoch/duplicate invariants |
| src/domain/replay.ts | 48 deterministic events over 27 seconds; no direct state injection |
| src/api/telemetryClient.ts | Same-origin FIFO queue, three attempts, degraded/overflow status |
| src/hooks/useAdaptiveRuntime.ts | Session IDs, reducer handoff, replay timers, telemetry enqueue |
| src/App.tsx | Existing presentation plus causal distribution diagnostics |
| db/001-uiadapt-demo.sql | Four InnoDB/utf8mb4 telemetry tables and constraints |
| server/validation.mjs | Body, enum, UUID, numeric, and payload validation |
| server/db.mjs | MySQL pool, credential-file loading, parameterized transactions |
| server/uiadapt-api.mjs | Loopback health/session/trajectory HTTP API |
| scripts/password-gateway.mjs | Fixed static/API upstream routing and auth stripping |
| deploy/systemd/uiadapt-api.service | Loopback API systemd unit and credential contract |
| .github/workflows/verify.yml | Disposable MySQL 8 integration job |
| review/uiadapt-distribution-engine-v1/ | Append-only commands, manifest, report, and risks |

### Task 1: Domain contract and taxonomy

Files: Modify src/domain/types.ts; create src/domain/behaviorConfig.ts, src/domain/behaviorTaxonomy.ts, and src/domain/behaviorTaxonomy.test.ts.

- [ ] Write tests proving every current event maps to exactly one of BROWSE, DETAIL, COMPARE, DECISION, or CART_INTENT, and the reference is 0.50/0.20/0.15/0.10/0.05.
- [ ] Run npm test -- src/domain/behaviorTaxonomy.test.ts; expected RED is missing exports.
- [ ] Add the five-dimension types and constants: window 20, evidence 15, enter 0.30, release 0.20, persistence 3.
- [ ] Implement the total mapping: VIEW_PRODUCT to BROWSE; OPEN_DETAILS to DETAIL; ADD/REMOVE_COMPARE to COMPARE; CHECK_PRICE/CHECK_REVIEWS/SELECT_COLOR/CHECK_SHIPPING to DECISION; ADD_TO_CART to CART_INTENT.
- [ ] Run the focused test and npm run lint; both must be RC 0.
- [ ] Commit only the four named files with message feat: define behavior dimensions and distribution tuning.

### Task 2: Bounded distribution and normalized L1

Files: Create src/domain/distribution.ts and src/domain/distribution.test.ts.

- [ ] Write tests for 21 to 20 sliding eviction, probability sum 1 within 1e-9, all values in 0..1, identical score 0, disjoint score 1, and an unrounded 0.30 boundary.
- [ ] Run npm test -- src/domain/distribution.test.ts; preserve the expected missing-module RED result.
- [ ] Implement evaluateDistribution(events) using events.slice(-20), one taxonomy call per event, and empty-input zero semantics.
- [ ] Implement normalizedL1(current, reference) as clamp(sum(abs(delta))/2, 0, 1); thresholds use the raw number and only the UI formats it.
- [ ] Run npm test -- src/domain/distribution.test.ts src/domain/behaviorTaxonomy.test.ts and npm run lint.
- [ ] Commit only distribution files with message feat: add bounded behavior distribution scoring.

### Task 3: Transition engine

Files: Create src/domain/transitionEngine.ts and src/domain/transitionEngine.test.ts.

- [ ] Write real-engine tests for 14-event no-transition, 15-event eligibility, one-spike no-transition, three identical candidate evaluations, candidate-flip reset, exact 0.30 enter, exact 0.20 release, COMPARE to PURCHASE_INTENT, PURCHASE_INTENT to COMPARE, and return to EXPLORE.
- [ ] Run npm test -- src/domain/transitionEngine.test.ts; preserve the missing-module RED.
- [ ] Implement candidate order PURCHASE_INTENT when DECISION+CART_INTENT is at least 0.60 and CART_INTENT is at least 0.10; otherwise COMPARE when COMPARE is at least 0.35; otherwise EXPLORE.
- [ ] Gate non-EXPLORE candidates at score at least 0.30, EXPLORE release at score below 0.20, and require persistence 3. Candidate flips reset persistence to 1. Do not retain a monotonic state rank.
- [ ] Run transition, distribution, and taxonomy tests; expected RC 0.
- [ ] Commit only transition files with message feat: gate distribution transitions with evidence and hysteresis.

### Task 4: Runtime, policy, and replay integration

Files: Modify src/domain/types.ts, src/domain/runtime.ts, src/domain/replay.ts, src/domain/runtime.test.ts; create src/domain/policy.ts and src/domain/replay.test.ts.

- [ ] Write RED tests asserting a 48-event replay produces exactly EXPLORE to COMPARE to PURCHASE_INTENT without SET_STATE, Adaptive OFF keeps identical evidence but applies EXPLORE, Reset changes session ID/epoch, stale events are rejected, and existing product/clock/manual-takeover invariants remain.
- [ ] Run npm test -- src/domain/runtime.test.ts src/domain/replay.test.ts; preserve the old FOCUS/12-event failure.
- [ ] Integrate taxonomy to distribution to transition to policy in the pure reducer. Add session ID, sequence number, distribution snapshot, transition record, and telemetry status without generating UUIDs or calling network APIs inside the reducer.
- [ ] Keep policy explicit: PURCHASE_INTENT reuses decision support; COMPARE reuses comparison; Adaptive OFF forces applied EXPLORE while detected evidence continues.
- [ ] Replace the fixture with 48 events at 500 ms intervals: events 1 to 14 contain 7 BROWSE, 4 DETAIL, and 3 COMPARE; 15 to 23 are COMPARE-heavy; 24 to 37 are DECISION/CART_INTENT-heavy; 38 to 48 sustain the final state; completion remains 27,000 ms.
- [ ] Run npm test -- src/domain and npm run lint; commit named files with message feat: replace heuristic runtime with distribution transitions.

### Task 5: Bounded telemetry client

Files: Create src/api/telemetryClient.ts and src/api/telemetryClient.test.ts; modify src/hooks/useAdaptiveRuntime.ts and src/domain/types.ts.

- [ ] Write RED tests for FIFO order, max 128 frames, no silent oldest drop on overflow, three attempts, retry exhaustion to DEGRADED, and local state independence from fetch failures.
- [ ] Run npm test -- src/api/telemetryClient.test.ts; preserve the missing-module RED.
- [ ] Implement serialized same-origin POSTs to /api/uiadapt/sessions and /api/uiadapt/trajectory, max queue 128, max three attempts, 100/250/500 ms backoff, explicit OVERFLOW, and DEGRADED after exhaustion.
- [ ] In the hook, compute the next pure reducer snapshot before dispatch, enqueue only accepted event frames, create a new session on load/reset/replay, and never await telemetry before applying local state.
- [ ] Run telemetry and domain tests, then lint. Commit with message feat: add bounded telemetry queue without decision coupling.

### Task 6: Developer View and UI regression

Files: Modify src/App.tsx, src/App.test.tsx, e2e/storefront.spec.ts; modify src/styles.css only if the existing diagnostic grid needs a direct layout adjustment.

- [ ] Write RED assertions for windowSize / 20, minimum evidence, reference/current distributions, raw score display, candidate/persistence, detected/applied state, telemetry status, and the new replay states.
- [ ] Run focused Vitest and Playwright grep; preserve failures caused by old FOCUS/8-event labels.
- [ ] Change only state-copy keys, diagnostic fields, and evidence labels. Keep product cards, visual hierarchy, controls, catalog JSON, focus behavior, and nested assets unchanged.
- [ ] Run npm test -- src/App.test.tsx src/domain and focused E2E tests; commit with message feat: expose distribution evidence in investor diagnostics.

### Task 7: MySQL schema, validation, API, and integration

Files: Modify package.json and package-lock.json; create db/001-uiadapt-demo.sql, server/validation.mjs, server/db.mjs, server/uiadapt-api.mjs, server/uiadapt-api.test.mjs, and server/uiadapt-api.integration.test.mjs.

- [ ] Write Node ESM RED tests for malformed JSON/content type 400, body limit 413, semantic enum errors 422, invalid UUID/sequence/score 400, exact duplicate 200, and conflicting duplicate 409.
- [ ] Add mysql2 and test:api-integration; run npm install --package-lock-only followed by npm ci. Do not run npm audit fix.
- [ ] Create four InnoDB/utf8mb4 tables: sessions, events, distribution_snapshots, transitions. Use foreign keys, ordered sequence keys, unique event identity, no PII, no triggers/procedures, and no state logic in SQL.
- [ ] Implement credential-file loading without logging, parameterized pool/transaction helpers, session creation, trajectory transaction, exact idempotency, conflict 409, and ordered trajectory query.
- [ ] Implement loopback health/session/trajectory endpoints. Missing credential fails closed; unavailable MySQL yields health 503 and never changes browser state.
- [ ] Run node --test server/uiadapt-api.test.mjs. Run node --test server/uiadapt-api.integration.test.mjs locally only if a disposable MySQL URL exists; otherwise record unavailable, never install/start/provision MySQL. Run the same integration command in CI and commit with message feat: persist distribution trajectories in MySQL.

### Task 8: Fixed gateway routing and operations

Files: Modify scripts/password-gateway.mjs, scripts/password-gateway.test.mjs, scripts/nwg-deployment-contract.test.mjs, deploy/systemd/uiadapt-gateway.service, and .github/workflows/verify.yml; create deploy/systemd/uiadapt-api.service.

- [ ] Write RED tests for authenticated API 200, unauthenticated API 401 with zero upstream contact, static 200 on 5173, fixed 4181 routing for absolute-form/SSRF-looking URLs, and Authorization stripping.
- [ ] Add UIADAPT_GATEWAY_API_UPSTREAM=http://127.0.0.1:4181; select upstream only from pathname prefix /api/uiadapt, preserving HTTP/WebSocket target hardening.
- [ ] Add the API unit with loopback 4181, LoadCredential, uiadapt_demo, uiadapt_demo_app, restart/hardening settings, and no secret value. Wire gateway Wants/After without changing Funnel mappings.
- [ ] Add a disposable MySQL 8 GitHub Actions service job with health check, temporary credentials, npm ci, schema/integration test, and no credential artifacts. Retain existing Node 22/24 gates.
- [ ] Run npm run test:gateway and npm run test:deployment; commit with message feat: route telemetry through fixed loopback gateway.

### Task 9: Docs and append-only evidence

Files: Modify README.md, docs/investor-stage-nwg-release.md, docs/security/investor-preview-threat-model.md; create review/uiadapt-distribution-engine-v1/README.md, raw command logs, and manifest.json.

- [ ] Document states, dimensions, thresholds, raw-score rule, queue degradation, loopback API, credential-file contract, CI-only DB, and PURCHASE_INTENT as a non-purchase behavior state.
- [ ] Record base/head SHA, branch, changed files, baseline/new counts, RED/GREEN commands, CI URL/artifact, review findings, risks, live mutation=false, live provisioning=false, and main merge=false.
- [ ] Hash raw logs and manifest entries without storing credentials or credential hashes. Run rg consistency checks and git diff --check.
- [ ] Commit explicit documentation/evidence paths with message docs: define distribution engine telemetry evidence contract.

### Task 10: Independent review and fresh verification

Files: No source edits after the implementation worker declares READY_FOR_INDEPENDENT_REVIEW, except separate commits for review findings with new RED records.

- [ ] Freeze exact SHA, status, diff stat, diff-check, changed-file inventory, and review scope.
- [ ] Independently search the feature SHA for duplicate L1/transition logic, direct replay state injection, SQL interpolation, secrets, API upstream selection, catalog mutation, Adaptive OFF divergence, unbounded queue, and live mutation.
- [ ] Run fresh: npm ci, lint, Vitest, gateway, deployment, build-base, build, build:nwg, API integration, E2E, audit, and diff-check. Record every RC and test count.
- [ ] Verify Grafana, R8 live, and park source worktrees retain their pre-mission status. Do not interpret local MySQL absence as an integration pass.
- [ ] Complete the final report and select only SOURCE_READY_FOR_DEPLOYMENT_REVIEW, PARTIAL_SUCCESS, or FAILED; LIVE_DEPLOYED is forbidden.

## Spec coverage self-review

| Requirement | Plan tasks |
|---|---|
| Five dimensions and one-to-one mapping | 1–2 |
| 20-window and normalized L1 | 2 |
| Evidence 15, persistence 3, hysteresis 0.30/0.20 | 3 |
| Bidirectional three-state model | 3–4 |
| Policy and Adaptive OFF | 4 and 6 |
| 48-event/27-second causal replay | 4 |
| Developer View evidence | 6 |
| Four tables, API, transaction/idempotency | 7 |
| Queue degraded/overflow | 5 |
| Fixed gateway and SSRF tests | 8 |
| CI/deployment/runbook/security | 8–9 |
| Independent review/fresh evidence/non-mutation | 9–10 |

The plan contains no unspecified file, placeholder implementation, live mutation step, or unowned completion claim.
