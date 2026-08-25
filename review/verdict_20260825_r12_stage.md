# Code Supreme Court Verdict — MK-R12 Stage

meta:
  case_id: SCOTINFRA-2026-0825-R12
  recorded_at: 2026-08-25
  review_mode: standard
  review_target: 10727e4fb4835908627423455f6c808664f30ec5
  comparison_base: b26658b6a5dc8136bcb588b2dc0ae25032f64ae4
  branch: codex/uiadapt-r12-stage
  pull_request: https://github.com/KaronLabs/UiAdapt-demo-scv/pull/3
  specification: review/spec_20260825_r12_stage.md
  provenance: This file records the verdict supplied by an independent session and model after direct repository, artifact, and GitHub CI inspection. Creating this file did not rerun those checks and does not change the target to which the verdict applies.

## Final Order

review_verdict: NOT GUILTY
disposition: APPROVE
penalty_score: 0
honor_score: 95 / 100
scope: The verdict is final only for `10727e4fb4835908627423455f6c808664f30ec5`.

No remediation or additional code change is ordered. Merge and deployment remain subject to the project's separate operating policy.

## Case Summary

- The independent reviewer confirmed the local worktree target and the logical Gate 0 comparison range.
- `b26658b..10727e4` measured 32 changed files, 2721 insertions, and 16 deletions.
- All 12 required acceptance criteria were accepted from direct inspection or exact-target CI evidence.
- No indictment or blocking implementation defect remained.
- `review_mode: standard` was accepted because the change introduced no API, database, authentication, permission, secret, or public network-boundary change.

## Independent Findings

### Code and diff

- The Stage implementation uses React application code rather than an iframe, `dangerouslySetInnerHTML`, `srcdoc`, or static mockup injection.
- `src/stage/stageReplay.ts` passes the canonical `REPLAY_EVENTS` to the existing reducer without modifying payloads or order; only presentation delivery time is rescheduled.
- `src/main.tsx` preserves synchronous storefront mounting before the first asynchronous Stage import.
- `review/r12/tools/evidence-publication.mjs` preserves the last passing evidence set when a new evidence run fails.

### Protected Gate 0 assets

The reviewer reported direct SHA-256 agreement for all five protected assets and found no protected path in the logical R12 diff:

| Asset | Verified SHA-256 prefix |
| --- | --- |
| `review/r12/uiadapt-stage.html` | `7c50ca…` |
| `review/r12/gate0-verdict.md` | `08f3e6…` |
| `review/r12/baseline/stage-EXPLORE.png` | `0d9846…` |
| `review/r12/baseline/stage-COMPARE.png` | `31666a…` |
| `review/r12/baseline/stage-PURCHASE_INTENT.png` | `35242f…` |

### Visual and recording evidence

The reviewer independently recalculated Gaussian SSIM with NumPy/SciPy rather than relying on the repository's `ssim.js` implementation:

| State | Independent SSIM | Required minimum | Result |
| --- | ---: | ---: | --- |
| EXPLORE | 0.9966 | 0.8500 | PASS |
| COMPARE | 0.9953 | 0.8500 | PASS |
| PURCHASE_INTENT | 0.9960 | 0.8500 | PASS |

Independent `ffprobe` inspection reported:

- duration: 27.000 seconds
- dimensions: 1920 × 1080
- video codec: VP8
- container: Matroska/WebM

The independent values are consistent with the repository report while remaining methodologically separate from it.

### Exact-target CI

- Run: https://github.com/KaronLabs/UiAdapt-demo-scv/actions/runs/32784319306
- Head SHA: `10727e4fb4835908627423455f6c808664f30ec5`
- `verify`: success
- `api-integration`: success
- `runtime-contract`: success

The reviewer confirmed that the workflow executed the exact-target assertion, regression tests, Chrome 145 gate, Stage contracts, SSIM/recording generation, dependency audit, and whitespace validation. The merge-base fallback preserves the original whitespace failure when ancestry exists and uses the two-dot fallback only when ancestry is unavailable.

### Test contract

- Nineteen Stage browser tests exist and passed on the exact-target CI run.
- The suite covers the 13 visual contracts plus routing, controls, timing, domain invariants, deterministic replay, and keyboard checkpoints.
- No new `.skip` or `.only` was found.
- Product IDs and prices are compared against canonical catalog data.

## Commendations

1. Failed negative-path attempts and eight earlier failed or cancelled CI runs were disclosed with their SHA, failure stage, and corrective commit rather than being rewritten as successful evidence.
2. The SSIM tool, video validator, evidence publisher, and CI workflow have executable checks of their own.
3. The independent reviewer reported agreement for every remeasured diff count, protected hash, SSIM value class, media property, PR coordinate, CI job, and Stage-test fact.

## Non-blocking Observations

- Approved Expo KPI labels such as `17 / 15` and `0.41` are presentation labels, not the reducer's raw `20` and `0.45` values. Raw domain values remain exposed through `data-domain-*` attributes. Future prose should keep that distinction explicit.
- `stageEventTime` uses checkpoint boundary constants whose behavior is tested, but their derivation is explained only briefly in source.
- PR #3 is stacked on R11 PR #2. Merge PR #2 first so PR #3's physical GitHub review surface contracts to the logical R12 scope.
- Physical projector acceptance and production deployment were not part of this verdict.

## Probationary Test

None. No additional code verification is ordered for the reviewed target. Any later commit creates a new review target and cannot inherit this exact-SHA verdict automatically.

## Signature

Independent verdict: **NOT GUILTY — APPROVE**

Recorded without modification to the reviewed implementation, its protected Gate 0 assets, or its CI evidence.
