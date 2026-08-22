# Trajectory and Rollback Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make rollback capability-aware and make persisted telemetry match supported UI state transitions with enforceable persistence continuity.

**Architecture:** Keep session rows as initial metadata and move causal adaptive policy to each snapshot. Validate recurrence using the previous persisted snapshot and branch rollback checks on target API capability.

**Tech Stack:** TypeScript, React, Node.js ESM, mysql2, MySQL 8, Node test runner, Vitest.

---

### Task 1: Telemetry snapshot policy and mixed source

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/hooks/useAdaptiveRuntime.ts`
- Modify: `server/validation.mjs`
- Modify: `server/db.mjs`
- Modify: `db/001-uiadapt-demo.sql`
- Test: `server/db.test.mjs`
- Test: `server/uiadapt-api.integration.test.mjs`
- Test: relevant TypeScript tests constructing `TelemetryFrame`

- [ ] Add failing tests proving `REPLAY -> USER` succeeds in one session and ON/OFF/ON policy is evaluated from each snapshot.
- [ ] Run the focused tests and confirm they fail for source equality and missing snapshot adaptive state.
- [ ] Add `snapshot.adaptiveEnabled`, persist/read `adaptive_enabled`, remove session/event source equality, and evaluate applied-state policy from the snapshot.
- [ ] Run focused tests and confirm both valid flows pass while invalid adaptive/applied combinations still fail.

### Task 2: Persistence recurrence integrity

**Files:**
- Modify: `server/validation.mjs`
- Test: `server/db.test.mjs`
- Test: `server/uiadapt-api.integration.test.mjs`

- [ ] Add a failing regression for previous persistence zero followed by non-transition persistence two.
- [ ] Add positive controls for zero-to-one, one-to-two, reset-to-zero, and two-to-transition-three.
- [ ] Run focused tests and confirm the forged trajectory is accepted before the fix.
- [ ] Implement the minimal recurrence checks in `assertTrajectoryContinuity`.
- [ ] Run focused tests and confirm forged input is rejected without insertion and controls pass.

### Task 3: Legacy-aware rollback

**Files:**
- Modify: `docs/investor-stage-nwg-release.md`
- Modify: `scripts/nwg-deployment-contract.test.mjs`

- [ ] Add a failing executable fixture where previous R8 has static/gateway artifacts but no API file.
- [ ] Inject R9 switch failure and assert pointer restoration, static/gateway restart, API stop, and legacy smoke success.
- [ ] Run the focused deployment test and confirm current unconditional API restart/readiness fails it.
- [ ] Branch rollback readiness on `target/server/uiadapt-api.mjs` while preserving strict API/DB health for capable releases.
- [ ] Run deployment tests and confirm both legacy and API-capable controls pass.

### Task 4: Independent review and probationary verification

**Files:**
- Create: `review/retrial_petition_20260822.md`

- [ ] Dispatch a fresh spec-compliance reviewer with the diff and court requirements.
- [ ] Dispatch a different code-quality reviewer after spec approval.
- [ ] Run every Chapter 6 command in a separate verification agent/session.
- [ ] Run `UIADAPT_INTEGRATION=1 npm run test:api-integration` against disposable MySQL with zero skips.
- [ ] Record exact target SHA, commands, return codes, bounded output, UTC timestamps, changed-file digest, and residual limitations in the retrial petition.
- [ ] Commit only scoped source, tests, design, plan, and retrial petition; push the branch after fresh verification.

