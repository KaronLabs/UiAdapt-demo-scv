# UIAdapt R8 Court Remediation Design

## Status

User-approved remediation design derived from case `2026-UIA-INV-R3-0821`.

## Adjudication

### Rebut with existing raw evidence

- The R3 package exists locally and is sealed by a self-excluding 40-entry SHA-256 manifest.
- R3 contains raw source, unit, gateway, deployment, build, Playwright, audit, runtime, public-smoke, provenance, risk-register, threat-model, and 18 screenshot artifacts.
- The exact source SHA `fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91` is already the running nwg release and passed authenticated public smoke.
- Therefore “no evidence,” “no threat model,” and “live release not verified” are evidence-transfer failures, not factual absence.

### Accept and remediate

- `scripts/nwg-deployment-contract.test.mjs` mutates `projectRoot/www/uiadapt_demo` and hard-codes port 5173.
- README omits the current investor-stage and nwg verification/operations contract.
- The threat model is sealed in R3 but is not persisted as a tracked repository document.
- The exact investor branch has no remote CI execution because the workflow triggers only on main or PRs to main.
- ESLint currently scans generated `www/` and court evidence, so a post-build/evidence workspace cannot reproduce `npm run lint`.

## Architecture

The production staging implementation remains unchanged. Only the integration-test harness moves mutable state under a unique `mkdtemp()` root. It runs the ordinary build, invokes `stageNwg({ sourceRoot, wwwRoot: temporaryWwwRoot })`, serves the temporary tree, and uses OS-selected loopback ports. Cleanup is constrained to the temporary root.

The regression contract proves three predicates:

1. a sentinel under the real `projectRoot/www/uiadapt_demo` is byte-identical after the deployment test;
2. preoccupying `127.0.0.1:5173` does not affect the deployment test;
3. integration cleanup never targets a path outside its unique temporary root.

Documentation records the actual SHA-release/current-symlink/systemd/Funnel architecture, credential ownership and rotation, readiness/rollback procedure, and the known security responsibility split. The workflow adds an exact remediation-branch push trigger so GitHub Actions tests the pushed head SHA without merging main.

## Mutation Allowlist

- `scripts/nwg-deployment-contract.test.mjs`
- `eslint.config.js`
- `.github/workflows/verify.yml`
- `README.md`
- `docs/investor-stage-nwg-release.md`
- `docs/security/investor-preview-threat-model.md`
- `docs/superpowers/specs/2026-08-21-uiadapt-r8-remediation-design.md`
- `docs/superpowers/plans/2026-08-21-uiadapt-r8-remediation.md`
- append-only `review/r8_*/`, `review/spec_*_r8*.md`, and evidence receipts

## Explicit Non-goals

- no UI, catalog, state-engine, Replay, gateway-authentication, systemd-unit, password, Funnel, or live-release mutation;
- no main merge or automatic deployment;
- no invented rate limiter, proxy rewrite, dedicated account, or timeout implementation;
- no deletion or rewriting of R1-R3 evidence.

## Verification Boundary

- focused RED/GREEN: real sentinel preservation and 5173 occupation;
- deployment suite: all deployment contract tests;
- source perimeter: lint, Vitest, gateway, build-base, production build, Playwright, production audit;
- remote perimeter: GitHub Actions exact `head_sha` and both jobs;
- evidence perimeter: command/streams/RC/UTC captures, exact diff, public runtime read-only receipt, manifest seal/verify, independent code review.

## Residual Limits

- Human `PRODUCT_CLARITY` remains `NOT_VERIFIED`.
- Full host reboot remains `NOT_EXECUTED`.
- Basic Auth has no application-layer rate limiter; Tailscale/Funnel and credential rotation are operational controls.
- Existing live release is not redeployed by this remediation unless a later explicit instruction authorizes it.
