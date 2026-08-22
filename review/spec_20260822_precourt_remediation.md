# Code Supreme Court Review Spec

meta:
  created_at: 2026-08-22T01:02:57Z
  review_mode: high_risk
  review_target: `56d0938` (`codex/uiadapt-distribution-engine-v1`), containing the 10-file code patch listed below
  comparison_base: `269ca4559fc4aa7dab18e8124812688bc012c967`
  alternative_comparison_evidence:
    status: available
    items:
      - The code remediation commit is `56d0938`, with parent/comparison base `269ca4559fc4aa7dab18e8124812688bc012c967`.
      - `git diff --name-status` identified 10 modified implementation, test, workflow, and runbook files.
      - `git diff --stat` reported 238 insertions and 45 deletions.
      - The working tree also contains pre-existing untracked `review/**` material that was not modified or used as the target patch.
  feedback_source:
    - User request for high-intensity self-review before Code Supreme Court submission.
    - Four scoped adversarial reviews of domain/runtime, API/MySQL, telemetry/gateway/operations, and CI/deployment behavior.
  scope:
    - Remediate reproducible correctness, availability, transaction-lifecycle, CI, and deployment-readiness defects found in the current UIAdapt Distribution Engine v1 work.
    - Preserve existing source authority boundaries and avoid production deployment or production database mutation.
  changed_files:
    - `.github/workflows/verify.yml`
    - `docs/investor-stage-nwg-release.md`
    - `scripts/nwg-deployment-contract.test.mjs`
    - `server/db.mjs`
    - `server/db.test.mjs`
    - `src/api/telemetryClient.test.ts`
    - `src/api/telemetryClient.ts`
    - `src/domain/replay.test.ts`
    - `src/domain/runtime.test.ts`
    - `src/domain/runtime.ts`
  reviewer_access_assumption: The independent reviewer can fetch commit `56d0938`, read its diff, tests, workflow, and runbook, and execute non-production verification. Production deployment, production MySQL writes, and secrets are not authorized.
  constitution_documents:
    status: present
    paths:
      - `E:/03_AllWork/grafana/AGENTS.md` (active parent/workspace instruction supplied for this task)
      - `E:/03_AllWork/uiadapt-distribution-engine-v1/README.md`
    applicability: AGENTS.md governs tone, minimal surgical changes, goal-oriented tests, and implementation/reviewer separation. README.md defines the project behavior and verification commands.

summary:
  Seven reproducible defects found during adversarial review were corrected with focused regression tests.
  Adaptive UI now preserves detected product focus across OFF/ON without exposing adaptive presentation while OFF.
  REPLAY events are accepted only while replay is RUNNING, preventing stale callbacks after pause, stop, completion, reset, or manual takeover.
  Telemetry fetches have bounded attempts, session admission remains ordered at queue capacity, and unreachable retry documentation was removed from the implementation contract.
  MySQL connections are released when transaction start fails.
  First-push CI diff checking handles the all-zero base SHA.
  Deployment switch and rollback readiness now require the API unit and authenticated API/DB health, not only static and gateway health.

rationale:
  The prior source passed its existing suites but admitted concrete counterexamples involving irreversible UI state loss, stale replay mutation, telemetry deadlock/orphan frames, transaction connection leakage, first-push CI failure, and false-positive deployment readiness.
  Each correction was constrained to the smallest responsible component and paired with a regression that failed before the fix.
  Client-side distribution decisions remain client-authoritative; no duplicate server-side adaptive algorithm was added.
  Actual production deployment, production service restart, production DB mutation, broad evidence packaging, and a new HTTP-to-disposable-MySQL integration harness were intentionally excluded.

changes:
  - path: `.github/workflows/verify.yml`
    status: modified
    change: Uses the empty Git tree when `github.event.before` is the all-zero SHA; preserves the existing comparison for normal push and pull-request runs.
    reason: A new branch's first push otherwise fails with `fatal: bad object` before verification can run.
  - path: `docs/investor-stage-nwg-release.md`
    status: modified
    change: Restarts and checks the API unit in switch/recovery paths and requires authenticated `/api/uiadapt/health` HTTP 200 within the bounded readiness procedure.
    reason: Static and gateway health alone could declare success while API or DB health was unavailable.
  - path: `scripts/nwg-deployment-contract.test.mjs`
    status: modified
    change: Adds first-push zero-SHA and API/DB readiness regression coverage and updates affected workflow/runbook assertions.
    reason: Makes both CI and rollback/readiness defects executable regressions.
  - path: `server/db.mjs`
    status: modified
    change: Moves `beginTransaction()` inside the protected lifecycle and rolls back only after a transaction started; always releases the acquired connection.
    reason: A begin failure previously bypassed `finally` and leaked the connection.
  - path: `server/db.test.mjs`
    status: modified
    change: Adds a regression proving one release and no rollback when transaction start fails.
    reason: Detects the connection lifecycle defect directly.
  - path: `src/api/telemetryClient.ts`
    status: modified
    change: Adds a one-second timeout and abort signal per attempt, aligns three attempts to 100/250 ms waits, and preserves a pending session admission ahead of same-session trajectories at queue capacity.
    reason: Prevents one permanently pending request from blocking the FIFO and prevents orphan trajectories after reset under capacity pressure.
  - path: `src/api/telemetryClient.test.ts`
    status: modified
    change: Adds deterministic fake-timer coverage for permanent pending fetches and a full-queue reset/session-order regression.
    reason: Existing tests did not exercise stalled fetches or session admission at capacity.
  - path: `src/domain/runtime.ts`
    status: modified
    change: Preserves detected focus independently from applied presentation and rejects REPLAY events unless replay status is RUNNING.
    reason: OFF previously erased focus irreversibly and inactive replay callbacks could still mutate state.
  - path: `src/domain/runtime.test.ts`
    status: modified
    change: Adds table-driven inactive replay rejection tests and adjusts canonical fixtures to enter RUNNING explicitly.
    reason: Covers IDLE, PAUSED, STOPPED, COMPLETED, and manual-takeover boundaries.
  - path: `src/domain/replay.test.ts`
    status: modified
    change: Adds OFF-to-ON focus restoration coverage and starts replay fixtures through the real replay transition.
    reason: Proves evidence preservation and applied-policy restoration.

implementation:
  core_logic: Runtime detection data is retained while presentation policy suppresses it when Adaptive UI is OFF. Telemetry attempts are bounded, and transaction ownership covers acquisition through release.
  data_flow: Browser event -> runtime detection/policy -> bounded telemetry FIFO -> authenticated gateway -> loopback API -> MySQL. Deployment readiness validates the API/DB health path through the authenticated gateway.
  state_transition: REPLAY events mutate runtime state only in RUNNING. SET_ADAPTIVE recalculates applied policy without deleting detected focus. Pending telemetry session admission precedes trajectories for that session.
  edge_conditions: Handles all-zero first-push SHA, permanently pending fetch, full telemetry queue during reset, transaction-start failure, and API/DB failure during switch or rollback.
  error_handling: Telemetry timeouts abort and count as failed attempts before DEGRADED status. Transaction-start errors preserve the original error and release the connection. Readiness fails closed when API unit or API/DB health is unavailable.
  I/O: Local browser fetches, gateway HTTP checks, systemd status calls documented in the runbook, and MySQL adapter calls.
  API_contract: No endpoint shape changed. Existing `/api/uiadapt/health` is now required during deployment and rollback readiness.
  DB_contract: No schema or query contract changed. Connection release is guaranteed when `beginTransaction()` rejects.
  persistence: Existing four-table trajectory persistence remains unchanged; no migration or production data mutation was performed.

impact:
  UI: Adaptive OFF/ON restores the detected product focus correctly; stale inactive replay callbacks cannot alter visible or diagnostic state.
  API: Endpoint behavior unchanged; deployment readiness now depends on authenticated health returning 200.
  DB: Transaction-start connection leak fixed; schema and stored data format unchanged.
  configuration: CI workflow gains zero-SHA handling; no new secret or environment variable.
  deployment: Switch and rollback readiness additionally require API unit and API/DB health.
  security: No new public endpoint or credential flow. Existing Basic Auth boundary is reused for the readiness request. A diff-scoped Codex Security review reported zero security findings across 45 changed files of the broader feature branch.
  performance: Each telemetry attempt can wait at most 1,000 ms plus bounded 100/250 ms backoff; normal successful requests incur no added delay.
  dependencies: none
  a11y: none
  i18n: none
  backward_compatibility: Existing API payloads, database schema, replay controls, and ordinary CI push/PR paths are preserved.
  data_retention: none
  logging_monitoring: Telemetry status continues to expose HEALTHY, DEGRADED, or OVERFLOW; no new secret logging.

threat_model:
  required: true
  trusted:
    - Fixed loopback API upstream and documented systemd units.
    - Server-side validation and parameterized MySQL operations.
  untrusted:
    - Browser-originated telemetry payloads.
    - Unauthenticated network requests reaching the gateway.
    - Network and process failures during switch or rollback.
  boundary_change: Deployment success now crosses the existing authenticated gateway-to-loopback-API boundary to verify API/DB health. No new public route or permission level was introduced.
  risk_scenarios:
    - A stalled fetch blocks all telemetry indefinitely.
    - A trajectory arrives before its session under queue pressure.
    - A transaction-start failure leaks a pool connection.
    - A deployment is declared healthy while API or DB is unavailable.
  mitigation:
    - Per-attempt timeout and abort with bounded retry.
    - Session-priority admission and same-session trajectory rejection until admission.
    - Guaranteed release after connection acquisition.
    - API unit check plus authenticated health 200 in bounded readiness.
  accepted_gaps:
    - No production smoke or production rollback was executed.
    - The disposable MySQL integration test was skipped locally because `UIADAPT_INTEGRATION=1` and its database were unavailable.

deployment_or_rollback:
  deployment_plan: No deployment is authorized by this submission. If later approved, use the version-addressed runbook and require static, gateway, API unit, unauthenticated-gateway, and authenticated API/DB health checks before declaring switch success.
  rollback_procedure: Use the documented previous-release link restoration, restart static/gateway/API units, and require the same bounded readiness checks. Preserve the original switch failure code if recovery succeeds.
  last_known_good_commit: unavailable

acceptance_criteria:
  - criterion: Adaptive OFF preserves detection evidence and ON restores PURCHASE_INTENT focus.
    required: true
    source: Adversarial domain/runtime counterexample derived directly from the requested behavior.
    result: PASS
    verification: `npm test` includes the OFF-to-ON regression and completed 58/58.
  - criterion: Inactive or stale REPLAY callbacks cannot mutate runtime events, sequence, or distribution.
    required: true
    source: User-requested high-intensity review; replay pause/stop/reset/manual-takeover contract.
    result: PASS
    verification: Table-driven runtime regressions cover IDLE, PAUSED, STOPPED, COMPLETED, and STOPPED_MANUAL_TAKEOVER; E2E covers pause/resume/reset/manual takeover/stop.
  - criterion: A permanently pending telemetry request terminates within the attempt budget and does not block the FIFO forever.
    required: true
    source: Adversarial telemetry counterexample.
    result: PASS
    verification: Fake-timer regression proves three timed-out attempts and DEGRADED state; full Vitest passed.
  - criterion: A reset session is admitted before trajectories for that session when the queue is full.
    required: true
    source: Adversarial telemetry ordering counterexample.
    result: PASS
    verification: Capacity-128 regression proves session-first ordering and rejects premature trajectory enqueue.
  - criterion: A MySQL connection is released if transaction start fails.
    required: true
    source: Adversarial API/MySQL lifecycle counterexample.
    result: PASS
    verification: `npm run test:api` includes the begin-failure regression; 21 passed, 1 skipped, 0 failed.
  - criterion: First-push CI does not diff against the all-zero SHA.
    required: true
    source: Adversarial CI counterexample.
    result: PASS
    verification: Deployment contract asserts empty-tree fallback; deployment suite passed 20/20.
  - criterion: Switch and rollback cannot report readiness while API or DB health is unavailable.
    required: true
    source: Adversarial deployment counterexample.
    result: PASS
    verification: Runbook contract requires API unit active and authenticated `/api/uiadapt/health` 200 after every restart; deployment suite passed 20/20.
  - criterion: Existing unit, API, gateway, build, E2E, dependency, and diff-hygiene checks remain green.
    required: true
    source: Project regression requirement.
    result: PASS
    verification: Fresh local results are listed under validation.
  - criterion: The final code review target receives exact-target CI validation.
    required: true
    source: Court protocol CI provenance rule for a changed target.
    result: NOT_VERIFIED
    verification: Commit `56d0938` exists locally, but no successful CI run bound to that exact SHA had been confirmed when this spec was authored.
  - criterion: DB/API behavior is exercised through the disposable MySQL integration boundary.
    required: true
    source: Court protocol test expectation for DB/API changes.
    result: NOT_VERIFIED
    verification: `npm run test:api` skipped one MySQL integration test because `UIADAPT_INTEGRATION` was not set to 1 and no disposable DB was configured.

validation:
  automated:
    - command: `npm test`
      result: PASS
      summary: 8 files, 58 tests passed.
      reason: Covers runtime, replay, policy, telemetry, and UI component regression behavior.
    - command: `npm run test:api`
      result: PASS
      summary: 21 passed, 1 skipped, 0 failed.
      reason: Covers transaction lifecycle, API validation/status mapping, idempotency, and persistence adapter behavior. Disposable MySQL integration remained skipped.
    - command: `npm run test:gateway`
      result: PASS
      summary: 17/17 passed.
      reason: Covers authentication, secret stripping, fixed upstream routing, malformed targets, API routing, and WebSocket behavior.
    - command: `npm run test:deployment`
      result: PASS
      summary: 20/20 passed.
      reason: Covers CI zero-SHA fallback, deployment contracts, API/DB readiness, rollback, staging, and gateway/static integration fixtures.
    - command: `npm run verify:build-bases`
      result: PASS
      summary: Nested-base and root-base production builds passed their asset and favicon checks.
      reason: Verifies both supported deployment bases.
    - command: `npm run build`
      result: PASS
      summary: TypeScript project build and Vite production build completed.
      reason: Verifies compilation and default production output.
    - command: `npm run build:nwg`
      result: PASS
      summary: Production build and NWG staging completed.
      reason: Verifies the documented staged layout.
    - command: `npm run test:e2e`
      result: PASS
      summary: 54/54 Playwright tests passed across desktop, laptop, and mobile projects.
      reason: Covers responsive UI, Adaptive ON/OFF behavior, replay transitions, timer cancellation, local telemetry degradation, and nested deployment paths.
    - command: `npm audit`
      result: PASS
      summary: 0 vulnerabilities reported.
      reason: Checks current dependency advisory state.
    - command: `git diff --check -- . ':(exclude)evidence/**'`
      result: PASS
      summary: Exit code 0 with no output.
      reason: Confirms patch whitespace hygiene.
  manual:
    - procedure: Production deployment, service restart, authenticated public smoke, rollback, and production DB verification.
      result: NOT_RUN
      observed_result: none
      reason: Explicitly outside the authorized source-only remediation scope.
      artifact: none
  ci:
    result: NOT_RUN
    target_sha: `56d0938`
    run: none
    covered_checks: none for the current patch
    uncovered_checks: All exact-target CI jobs, including disposable MySQL integration.
    summary: Prior CI belongs to the pre-remediation commit and is not claimed as validation of `56d0938`.

risks:
  - description: The final code patch has an immutable review SHA, but no exact-target CI success was confirmed when this spec was authored.
    severity: medium
    handling: fix_before_merge
    reason: The reviewer can inspect commit `56d0938`, but local tests alone do not replace exact-target CI provenance.
  - description: Disposable MySQL integration was not executed for the final patch.
    severity: medium
    handling: fix_before_merge
    reason: Unit and mocked HTTP/API tests pass, but the final DB adapter behavior has not been re-exercised against a real disposable MySQL instance.
  - description: Production switch, authenticated runtime health, and rollback were not executed.
    severity: medium
    handling: follow_up
    reason: Source readiness does not prove a production deployment; these checks are required only when deployment is authorized.
  - description: Existing untracked `review/**` artifacts are outside this spec and may be stale or inconsistent with the final patch.
    severity: low
    handling: safeguard
    reason: The independent reviewer should use this spec and the current diff, not infer freshness from unrelated historical artifacts.

request:
  allowed_verdicts:
    - NOT GUILTY
    - GUILTY
    - DEATH
  review_focus:
    - Whether Adaptive OFF/ON preserves detected focus without leaking adaptive presentation while OFF.
    - Whether all non-RUNNING replay statuses reject REPLAY mutation without breaking canonical replay.
    - Whether telemetry timeout and queue-capacity session ordering remain bounded and loss behavior is explicit.
    - Whether transaction start failure releases exactly once without masking the original error.
    - Whether zero-SHA CI fallback and API/DB readiness work for normal, failure, and recovery paths.
    - Whether the two NOT_VERIFIED required criteria must be completed before merge or Court acquittal.

brief:
  - 잘된 점: Independent scoped reviewers produced reproducible counterexamples, and each accepted defect received a focused RED-to-GREEN regression with a minimal patch.
  - 애매한 점: Existing client-authoritative distribution snapshots were not replaced with server-side algorithm recomputation because that would duplicate decision authority and exceed the requested remediation.
  - 어려웠던 점: Replay status, telemetry capacity, transaction ownership, CI provenance, and rollback readiness crossed separate layers while the mutation scope had to remain surgical.

status:
  partial_success

review_verdict:
  PENDING
