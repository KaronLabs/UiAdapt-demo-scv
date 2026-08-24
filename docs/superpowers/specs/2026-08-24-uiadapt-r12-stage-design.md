# UIAdapt R12 Stage Mode Design

## Objective

Add a real React/TypeScript Stage Mode for the 27-second Stark Expo presentation. The approved R12 mock and three 1920x1080 baseline images remain immutable visual references; the implementation must use the existing catalog, replay events, and runtime reducer.

## Provenance and immutable inputs

- Feature worktree: `/mnt/nvme-hot/ne/uiadapt-worktrees/r12-stage`
- Feature branch: `codex/uiadapt-r12-stage`
- Starting commit: `b26658b6a5dc8136bcb588b2dc0ae25032f64ae4`
- Parent/base: `cdda816b07d4e0aad1faa1d2187cff76342d1bff`
- Logical R12 review range: `b26658b..HEAD`. The GitHub PR targets `main` as requested and is stacked on the still-open R11 PR #2, so its physical diff also contains R11 until that dependency merges.
- Immutable files: the approved mock, Gate 0 verdict, and three baseline PNG files under `review/r12/`
- Final verification must reproduce their initial SHA-256 values.

## Route and loading boundary

The repository has no router dependency or routing convention beyond Vite's `/uiadapt_demo/` base. `src/main.tsx` will select Stage Mode when the normalized pathname is either `/stage` or `/uiadapt_demo/stage`; all other paths retain the existing application.

The normal storefront remains a synchronous import so its existing focus-sensitive E2E behavior is unchanged. Stage dynamically loads its component and namespaced stylesheet. Before Stage mounts, the storefront stylesheet links are removed because they contain hover and infinite-animation rules prohibited by the Stage contract. The Stage CSS preserves the approved mock's exact Wanted/Pretendard and IBM/Consolas family stacks and adds no external font request. The immutable mock contains no `@font-face`, so the implementation deliberately preserves the mock's platform-fallback render condition rather than changing the approved render input. This keeps Stage's rendered stylesheet surface isolated, at the accepted cost that the common entry still downloads and evaluates the storefront bundle.

The deployment convention is the Vite base path `/uiadapt_demo/`, so the physical production entry is `/uiadapt_demo/stage/`. `scripts/create-stage-entry.mjs` copies the generated HTML into `stage/index.html`, and both the Stage suite and evidence runner use the non-SPA `serve` command against the staged `www` tree. The pathname selector also recognizes logical `/stage` in development; no root-level production alias is claimed.

## Domain and deterministic replay

`snapshotAt(elapsedMs)` is a pure, bounded reconstruction:

1. create the initial runtime;
2. reset it for replay;
3. deliver canonical `REPLAY_EVENTS` unchanged and in order according to the Stage presentation schedule, then reduce them through `runtimeReducer`;
4. return the resulting snapshot.

The input is capped at 48 events, so each reconstruction is O(48) time and O(48) retained event space, effectively constant for this fixed demo. The controller uses elapsed wall time only to choose `elapsedMs`; application state is always reconstructed from canonical input. Keyboard 1/2/3 select 3000/12000/20000 ms and therefore exercise the same reducer path as playback. Pause retains elapsed time, reset selects zero, and completion clamps at `REPLAY_DURATION_MS`.

Canonical event objects, IDs, values, and order are unchanged, but their delivery clock is intentionally mapped to the 27-second Stage cue sheet. This prevents the domain's original 11.0s and 18.5s transitions from appearing before the approved 12s and 20s visual cues. Boundary tests fix EXPLORE through 11,999ms, COMPARE at 12,000ms, and PURCHASE_INTENT at 20,000ms. This is a presentation-specific replay schedule, not a claim that `event.atMs` was rewritten.

## Approved presentation metrics versus domain measurements

The approved visual contract requires Expo values `6/17/20` and `0.08/0.41/0.67`. They are not the runtime reducer's measurements. The canonical reducer produces event/window counts `6/20/20` and change scores `0.50/0.45/0.70` at the same checkpoints; with a 20-event window, `0.67` is mathematically impossible because the score lies on a 0.05 grid.

Therefore:

- `data-state`, transitions, product focus, product identity, and prices come from the real domain snapshot. The focused product ID drives both the highlighted card and purchase detail lookup.
- Approved numbers are named and rendered as `StagePresentationMetrics`, not as domain measurements.
- The Stage root exposes separate `data-domain-event-count`, `data-domain-sequence-no`, `data-domain-window-size`, `data-domain-focused-product-id`, and `data-domain-change-score` attributes so tests and reviewers can verify the distinction.
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

The contract test and Stage Playwright configuration were committed first while Stage was absent (`486f79c`, RED), followed by the implementation commit (`4ed1155`, GREEN). The GREEN commit also corrected two perimeter assumptions discovered during implementation: the physical production URL is the base-prefixed route, and IBM Plex Mono's assertion specifies weight 600. Because the test bytes are not identical across those two commits and no raw RED terminal stream was committed, the history is reported as contract-first RED/GREEN rather than a byte-identical forensic TDD capture.

### Existing regression suite

No existing test is modified, deleted, or skipped. After Stage green, run lint, unit, API, gateway, deployment, build-base verification, build, and the entire existing Playwright suite.

## SSIM and recording

Only SSIM tooling may add dev dependencies. Pin `ssim.js@3.5.0` and `pngjs@7.0.0`; neither is a runtime dependency.

`review/r12/tools/measure-stage-ssim.mjs` decodes baseline and actual PNGs, rejects dimensions other than 1920x1080, reports each mSSIM to four decimals, and exits nonzero if any value is below 0.85. If a state misses the threshold, the tooling emits all three documented per-pixel heatmaps.

The evidence runner uses Chrome 145, waits for the approved font stack and at least 700ms after a state jump, captures the three state screenshots, measures SSIM, and records one uninterrupted demo take with Playwright screencast. `ffprobe` verifies a VP8/VP9 WebM, 1920x1080 frame size, and measured duration. Generation occurs in a fresh sibling directory and replaces committed evidence only after capture and SSIM both pass, so a failed run cannot mix partial output with a prior PASS report. SSIM failure output is published separately under `review/r12/evidence-failure/` so the three heatmaps survive cleanup. Network observation spans navigation through pagehide plus a bounded quiet interval; it is not claimed beyond the active Stage page lifecycle. The runner does not trim or re-encode the recording.

## Error handling and exclusions

- State tableaux are selected by the required keyboard shortcuts 1/2/3; no query-string state API is exposed by the React Stage application.
- Fullscreen rejection is kept local to the control and does not corrupt replay state.
- No telemetry client is mounted in Stage Mode, ensuring the replay cannot POST externally.
- No iframe, `dangerouslySetInnerHTML`, copied mock document, CDN, external font, API, hover rule, or infinite animation is introduced.
- No production deployment or main-branch mutation is part of this implementation.

## Completion gates

Completion requires a red commit, a green commit, 13 Stage contracts passing on Chrome 145, three SSIM values at or above 0.85, a verified approximately 27-second webm, unchanged sacred hashes, all existing regression commands passing, an independent review, a pushed feature branch, a PR with the required report, and green CI for the exact PR SHA.
