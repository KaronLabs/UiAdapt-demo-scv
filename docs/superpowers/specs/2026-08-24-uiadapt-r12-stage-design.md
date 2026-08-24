# UIAdapt R12 Stage Mode Design

## Objective

Add a real React/TypeScript Stage Mode for the 27-second Stark Expo presentation. The approved R12 mock and three 1920x1080 baseline images remain immutable visual references; the implementation must use the existing catalog, replay events, and runtime reducer.

## Provenance and immutable inputs

- Feature worktree: `/mnt/nvme-hot/ne/uiadapt-worktrees/r12-stage`
- Feature branch: `codex/uiadapt-r12-stage`
- Starting commit: `b26658b6a5dc8136bcb588b2dc0ae25032f64ae4`
- Parent/base: `cdda816b07d4e0aad1faa1d2187cff76342d1bff`
- Immutable files: the approved mock, Gate 0 verdict, and three baseline PNG files under `review/r12/`
- Final verification must reproduce their initial SHA-256 values.

## Route and loading boundary

The repository has no router dependency or routing convention beyond Vite's `/uiadapt_demo/` base. `src/main.tsx` will select Stage Mode when the normalized pathname is either `/stage` or `/uiadapt_demo/stage`; all other paths retain the existing application.

The normal app and Stage Mode will be loaded through separate dynamic import branches. This is necessary because the existing global stylesheet contains hover and infinite-animation rules prohibited by the Stage contract. Stage Mode loads only the self-hosted font CSS and its namespaced Stage stylesheet. No runtime dependency or external asset is added.

Production deep-link fallback is a server concern: Vite preview supports the route used by the gates, while the current `serve` command has no `--single` option. This task will not alter deployment topology without an explicit deployment requirement; the residual direct-navigation risk is reported.

## Domain and deterministic replay

`snapshotAt(elapsedMs)` is a pure, bounded reconstruction:

1. create the initial runtime;
2. reset it for replay;
3. reduce the canonical `REPLAY_EVENTS` whose `atMs <= elapsedMs` through `runtimeReducer`;
4. return the resulting snapshot.

The input is capped at 48 events, so each reconstruction is O(48) time and O(48) retained event space, effectively constant for this fixed demo. The controller uses elapsed wall time only to choose `elapsedMs`; application state is always reconstructed from canonical input. Keyboard 1/2/3 select 3000/12000/20000 ms and therefore exercise the same reducer path as playback. Pause retains elapsed time, reset selects zero, and completion clamps at `REPLAY_DURATION_MS`.

The canonical domain transitions occur at 11.0s and 18.5s, so the required checkpoints at 3s, 12s, and 20s resolve to EXPLORE, COMPARE, and PURCHASE_INTENT respectively.

## Approved presentation metrics versus domain measurements

The approved visual contract requires Expo values `6/17/20` and `0.08/0.41/0.67`. They are not the runtime reducer's measurements. The canonical reducer produces event/window counts `6/20/20` and change scores `0.50/0.45/0.70` at the same checkpoints; with a 20-event window, `0.67` is mathematically impossible because the score lies on a 0.05 grid.

Therefore:

- `data-state`, transitions, product focus, product identity, and prices come from the real domain snapshot.
- Approved numbers are named and rendered as `StagePresentationMetrics`, not as domain measurements.
- The Stage root exposes separate `data-domain-event-count` and `data-domain-change-score` attributes so tests and reviewers can verify the distinction.
- No domain constants, replay events, or existing domain tests are changed.

## Component structure

- `src/stage/StageApp.tsx`: semantic Stage layout, controls, root data attributes, catalog-backed cards.
- `src/stage/stageReplay.ts`: pure replay reconstruction and approved checkpoint metadata.
- `src/stage/useStageController.ts`: play, pause, reset, keyboard jumps, and completion control.
- `src/stage/stage.css`: fully namespaced 1920x1080 visual contract, finite animations only.
- Existing `ProductArt` is reused for product artwork; `PRODUCTS` supplies all product IDs and prices.

The left panel is a state-independent component with no state-derived props. Its DOM, geometry, and pixels therefore remain invariant across all three states. The right slot keeps a 220px fixed height. All six cards use one grid definition so card width cannot vary by state.

## Test coverage perimeter

### New contract suite

`e2e/stage-mode.contract.ts` runs only through `playwright.stage.config.ts` with:

- Chrome 145 required and version checked;
- viewport and screen 1920x1080, DPR 1;
- `/uiadapt_demo/stage` navigation;
- all 13 visual contracts, including recursive stylesheet scans;
- play/pause/reset/fullscreen and keyboard 1/2/3 behavior;
- canonical domain attributes and catalog ID/price invariants;
- attempted external request interception, not only successful resource timing.

The file name intentionally does not match the existing `*.spec.ts` suite, so the existing 3-project viewport matrix remains unchanged.

### Red/green history

The new contract test and Stage Playwright configuration are committed first while `/stage` is absent. The focused Stage command must fail and its failure is recorded as the red commit. Production implementation follows; the same command must pass before the green commit.

### Existing regression suite

No existing test is modified, deleted, or skipped. After Stage green, run lint, unit, API, gateway, deployment, build-base verification, build, and the entire existing Playwright suite.

## SSIM and recording

Only SSIM tooling may add dev dependencies. Pin `ssim.js@3.5.0` and `pngjs@7.0.0`; neither is a runtime dependency.

`review/r12/tools/measure-stage-ssim.mjs` decodes baseline and actual PNGs, rejects dimensions other than 1920x1080, reports each mSSIM to four decimals, and exits nonzero if any value is below 0.85. If a state misses the threshold, the tooling emits all three documented per-pixel heatmaps.

The evidence runner uses Chrome 145, waits for local fonts and at least 700ms after a state jump, captures the three state screenshots, measures SSIM, and records one uninterrupted demo take with Playwright screencast. `ffprobe` verifies codec, 1920x1080 frame size, and measured duration. It does not trim or re-encode the recording.

## Error handling and exclusions

- Unknown state query values fall back to EXPLORE.
- Fullscreen rejection is kept local to the control and does not corrupt replay state.
- No telemetry client is mounted in Stage Mode, ensuring the replay cannot POST externally.
- No iframe, `dangerouslySetInnerHTML`, copied mock document, CDN, external font, API, hover rule, or infinite animation is introduced.
- No production deployment or main-branch mutation is part of this implementation.

## Completion gates

Completion requires a red commit, a green commit, 13 Stage contracts passing on Chrome 145, three SSIM values at or above 0.85, a verified approximately 27-second webm, unchanged sacred hashes, all existing regression commands passing, an independent review, a pushed feature branch, a PR with the required report, and green CI for the exact PR SHA.
