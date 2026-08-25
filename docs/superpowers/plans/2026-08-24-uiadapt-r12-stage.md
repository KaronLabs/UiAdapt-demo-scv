# UIAdapt R12 Stage Mode Implementation Plan

> Execute with test-first commits. Do not alter existing tests or the five immutable R12 reference files.

**Goal:** Deliver a deterministic, catalog-backed React Stage Mode at `/stage`, mechanically matching the approved 1920x1080 visual contract and producing reproducible SSIM and video evidence.

**Architecture:** The final implementation keeps the storefront mount synchronous to preserve its existing focus contract, while Stage dynamically loads its component and namespaced CSS after removing storefront styles. Stage preserves the immutable mock's font stacks and platform-fallback render condition because the approved standalone mock contains no font-face source. A pure `snapshotAt(elapsedMs)` function delivers unchanged canonical domain events on a Stage-specific cue schedule through `runtimeReducer`; a small controller selects elapsed time. Approved Expo KPI copy is explicitly separated from measured domain attributes.

**Final-scope note:** R12 is reviewed logically as `b26658b..HEAD`. The requested PR targets `main` and is stacked on open R11 PR #2, so the physical PR diff includes R11 until PR #2 merges. The publication report must disclose both scopes.

**Stack:** React 19, TypeScript 6, Vite 8, Playwright 1.62 with Chrome 145, Vitest, `ssim.js`, `pngjs`, ffprobe.

---

## Task 1: Establish and freeze the coverage perimeter

**Files:**
- Add: `e2e/fixtures/stage-audit.ts`
- Add: `e2e/stage-mode.contract.ts`
- Add: `playwright.stage.config.ts`
- Modify: `package.json`

1. Implement reusable audit helpers adapted from the approved mock: visible text size, effective contrast, state visibility, left-panel pixel hash, slot/card geometry, visible line width, exact state copy, external requests, recursive hover/infinite-animation scan, and computed font stacks.
2. Add 13 separately named contract tests plus route/browser, controls, domain/catalog, and deterministic replay tests.
3. Configure exactly one Chrome145 project at 1920x1080, screen 1920x1080, DPR1, failing closed when `CF_CHROME_BIN` is absent or the browser version is not `145.0.7632.117`.
4. Add only the `test:e2e:stage` package script. Do not add a runtime dependency.
5. Run `CF_CHROME_BIN=/home/ubuntu/opt/chrome145/chrome npm run test:e2e:stage -- --reporter=line` and confirm failure is caused by missing Stage root/contract, not test syntax.
6. Commit the test perimeter as `test(r12): codify stage mode contracts [red]`.

## Task 2: Build the pure replay model with unit tests

**Files:**
- Add: `src/stage/stageReplay.test.ts`
- Add: `src/stage/stageReplay.ts`

1. Write failing tests for snapshots at 0/3000/12000/20000/27000ms, canonical states and transitions, stable repeated reconstruction, approved-metric/domain-metric separation, and product invariants.
2. Run `npx vitest run src/stage/stageReplay.test.ts` and preserve the expected RED.
3. Implement `snapshotAt`, checkpoint selection, copy metadata, and formatting with no timer or I/O.
4. Re-run the focused test to GREEN.
5. Refactor only duplication visible in the new module while keeping O(48) reconstruction.

## Task 3: Implement route isolation and Stage controls

**Files:**
- Modify: `src/main.tsx`
- Add: `src/stage/StageApp.tsx`
- Add: `src/stage/useStageController.ts`
- Add: `src/stage/useStageController.test.tsx`

1. Write focused controller tests for play, pause, resume, reset, clamping at 27s, and keyboard 1/2/3 jumps.
2. Confirm the focused controller test is RED.
3. Implement the controller with `requestAnimationFrame`, monotonic elapsed accounting, cleanup on unmount, and pure snapshot reconstruction.
4. Implement a pathname branch for `/stage` and `/uiadapt_demo/stage`; keep the existing App synchronous, and dynamically load the Stage component and Stage stylesheet.
5. Render semantic controls and fullscreen action. Expose state, elapsed, completion, domain count, and domain score as root data attributes.
6. Run focused unit tests to GREEN.

## Task 4: Assemble the visual Stage shell

**Files:**
- Add: `src/stage/stage.css`
- Modify: `src/stage/StageApp.tsx`

1. Build the fixed 1920x1080 four-row shell, five KPI cells, invariant left panel, seam, stateful right slot, three catalog-backed cards, and control rail.
2. Reuse `ProductArt` and `PRODUCTS`; no copied mock document, iframe, or HTML injection.
3. Apply exact measured geometry and visual tokens. Namespace every rule beneath the Stage root or Stage classes.
4. Ensure all visible text, contrast, line widths, card widths, 220px slots, finite animations, and font stacks meet the 13-row contract.
5. Run the Stage contract suite. Iterate only on new Stage files until all tests pass.
6. Commit production implementation and focused tests as `feat(r12): assemble stage mode [green]` only after the same Stage contract command passes.

## Task 5: Add reproducible SSIM and evidence tooling

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Add: `review/r12/tools/measure-stage-ssim.mjs`
- Add: `review/r12/tools/capture-stage-evidence.mjs`

1. Add exact dev-only dependencies `ssim.js@3.5.0` and `pngjs@7.0.0`.
2. Implement dimension-checked SSIM reporting and fail below 0.85; emit all three heatmaps on any failure.
3. Implement Chrome145 captures after the approved font stack settles and finite animations complete. Reject attempted external requests for the browser-context lifetime and redact request query strings from failures.
4. Capture EXPLORE/COMPARE/PURCHASE_INTENT at the keyboard checkpoints and run SSIM.
5. If any score is below 0.85, inspect the generated diff heatmaps, change only Stage JSX/CSS, and repeat.
6. Record one real-time 27-second screencast and verify VP8/VP9 WebM codec/container, resolution, and duration with ffprobe without trimming.
7. Generate into a fresh run directory and publish evidence only after capture and SSIM both pass.
7. Commit tools and generated evidence as `test(r12): add stage visual evidence`.

## Task 6: Run independent verification and regression

**Ownership:** An independent verification agent runs commands; implementation agents do not certify their own output.

1. Recompute the five immutable SHA-256 values and compare them byte-for-byte with T0.
2. Run Stage contract on Chrome145 and record exact pass count.
3. Run `npm run lint`, `npm test`, `npm run test:api`, `npm run test:gateway`, `npm run test:deployment`, `npm run verify:build-bases`, `npm run build`, `npm run build:nwg`, and `npm run test:e2e`.
4. Run `git diff --exit-code b26658b -- e2e/storefront.spec.ts e2e/visual-layer.spec.ts` and inspect all existing test paths for changes.
5. Run the SSIM tool and ffprobe verification independently.
6. Request adversarial code review focused on route/CSS isolation, replay truthfulness, timing races, contract quality, and sacred-file integrity.
7. Fix any valid defect with focused RED/GREEN evidence, then repeat affected verification.

## Task 7: Publish the exact reviewed result

1. Prepare the seven-section MK-R12 assembly report using only final command output.
2. Push `codex/uiadapt-r12-stage` without force.
3. Open PR titled `feat(r12): stage mode — expo build` with the complete report body.
4. Verify CI targets the exact feature HEAD and every required job is green; do not substitute a prior SHA.
5. If CI fails, diagnose the first causal failure, patch through focused RED/GREEN, push, and wait for exact-SHA CI again.
6. Report completion only after PR and CI gates are satisfied.
