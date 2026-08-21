# UIAdapt R8 Court Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the destructive deployment-test counterexample, make verification reproducible, persist the operating/security contract, obtain exact-head remote CI, and produce an append-only R8 Court package.

**Architecture:** Production staging remains unchanged. The test harness owns a unique temporary staging root and dynamic loopback ports; repository documents and CI describe and prove the resulting boundary.

**Tech Stack:** Node.js 22/24, node:test, Vite, Playwright, ESLint flat config, GitHub Actions, systemd, Tailscale Funnel.

---

### Task 1: Freeze baseline and reproduce the counterexample safely

**Files:**
- Evidence only: `review/r8_*/evidence/`

- [ ] Capture current branch, SHA, status, R3 manifest verify, and live read-only runtime receipt.
- [ ] Reproduce the sentinel deletion only inside an exact-SHA disposable copy.
- [ ] Reproduce fixed-port conflict only inside the disposable copy.
- [ ] Record the current lint-boundary failure caused by generated/evidence artifacts.

### Task 2: Isolate deployment integration state

**Files:**
- Modify: `scripts/nwg-deployment-contract.test.mjs`

- [ ] Add a failing regression that preserves the real project sentinel.
- [ ] Add a failing regression that occupies 5173.
- [ ] Run RED and confirm failure is the expected deletion/port defect.
- [ ] Move staging and serving under `mkdtemp()`.
- [ ] Run `npm run build`, then call `stageNwg({ sourceRoot, wwwRoot })`.
- [ ] Use reserved loopback ports for both child services.
- [ ] Constrain cleanup to the temporary root.
- [ ] Run the focused regression and full deployment suite GREEN.

### Task 3: Bound lint inputs

**Files:**
- Modify: `eslint.config.js`

- [ ] Preserve the captured RED where generated/evidence files are linted.
- [ ] Ignore `www/**` and `review/evidence/**` only.
- [ ] Run `npm run lint` GREEN without deleting artifacts.

### Task 4: Persist release and security contracts

**Files:**
- Modify: `README.md`
- Create: `docs/investor-stage-nwg-release.md`
- Create: `docs/security/investor-preview-threat-model.md`

- [ ] Document the full safe verification sequence.
- [ ] Document immutable releases, `current`, systemd, credential metadata, health, rollback, and no-live-path test invariant.
- [ ] Document Internet → Funnel TLS termination → loopback gateway → static service boundary.
- [ ] Distinguish enforced controls, operational controls, accepted limits, and backlog.

### Task 5: Enable exact-head remote CI

**Files:**
- Modify: `.github/workflows/verify.yml`

- [ ] Add only `codex/uiadapt-investor-r8-remediation` to push branches.
- [ ] Keep main and PR triggers.
- [ ] Push the exact remediation branch after local verification.
- [ ] Verify both jobs report success for the exact pushed SHA and capture artifacts.

### Task 6: Full verification and independent review

**Files:**
- Evidence only

- [ ] Run the Court probation commands sequentially.
- [ ] Run sentinel before/after equality.
- [ ] Hold 5173 with a dummy listener while running deployment tests.
- [ ] Run `git diff --check`, secret scan, and source-scope audit.
- [ ] Request independent spec review, then independent code-quality review.
- [ ] Resolve every Critical/Important/Medium finding and repeat verification.

### Task 7: R8 package and integrity receipt

**Files:**
- Create append-only R8 spec and evidence directory.

- [ ] Separate rebutted charges from accepted/remediated charges.
- [ ] Bind every claim to command, stdout, stderr, RC, UTC, source, and SHA-256.
- [ ] Preserve all failed attempts and explain corrections.
- [ ] Seal a self-excluding SHA-256 manifest and verify it.
- [ ] Obtain a different-session pre-Court verdict.
- [ ] Freeze the final spec read-only.
