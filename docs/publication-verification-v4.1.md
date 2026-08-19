# UIAdapt Adaptive Storefront Theater v4.1 publication verification

## 판정 범위

이 문서는 v4.1 remediation branch의 현재 source와 로컬 production-like preview를 독립 검증자가 다시 실행할 수 있도록 기록한 publication verification 문서입니다. 과거 v4.0 자료인 `docs/evidence-receipt.md`, `docs/verification-report.md`, v4.0 screenshot evidence는 수정하지 않았습니다.

- Repository target: `https://github.com/KaronLabs/UiAdapt-demo-scv`
- Intended target branch: `main`
- Remediation branch: `fix/uiadapt-v4.1-product-contract`
- Worktree: `E:\03_AllWork\grafana\park-web-demo-v4.1`
- Base SHA: `68ac3a8abc1dfda26aa004d9d6d8e8db179b17d0`
- Source SHA used for the behavioral verification below: `d3696e324aa50f7ac566c374eff3e76c1e3d49cd`
- Publication state: local branch only; no push, merge, deployment, or live `uiadapt.com` modification was performed.
- Implementer gate: `READY_FOR_INDEPENDENT_REVIEW` (this document does not grant final PASS).

The documentation and CI artifact changes are intentionally recorded after the source verification SHA above. The final local Git SHA, including this publication document, must be taken from `git log -1 --oneline` at the time of independent review; the branch has not been published to GitHub.

## Product contract delivered

- Immutable canonical catalog remains shared across EXPLORE, COMPARE, FOCUS, Adaptive ON, and Adaptive OFF.
- Runtime flow remains `Behavior → Features → Detected State → Presentation Policy → UI`.
- `purchaseSupportSignalsByProduct` binds FOCUS evidence to the dominant product; another product's signal cannot activate that dominant product's FOCUS.
- Adaptive OFF keeps `detectedState` and diagnostics while forcing `appliedState = EXPLORE` and retaining EXPLORE storefront copy.
- Adaptive ON applies the detected presentation policy.
- COMPARE is rendered inside the stable main `demo-stage`; FOCUS hides comparison and exposes decision-support information.
- The merchant is named `Atelier Audio`; the adaptive technology layer is separately labeled `Powered by UIAdapt`.
- The 27-second deterministic Replay, Pause, Resume, Stop, Reset, manual takeover, focus preservation, keyboard navigation, reduced motion, local SVG art, local bundled fonts, and no-runtime-network contract remain in scope.

## Source inventory and publication paths

The remediation source diff from base `68ac3a8` to behavioral source `d3696e3` contains exactly these 16 paths:

```text
.gitattributes
.github/workflows/verify.yml
README.md
docs/superpowers/plans/2026-08-20-uiadapt-v4.1-remediation.md
docs/superpowers/specs/2026-08-20-uiadapt-v4.1-remediation-design.md
e2e/storefront.spec.ts
package-lock.json
package.json
playwright.config.ts
src/App.test.tsx
src/App.tsx
src/domain/runtime.test.ts
src/domain/runtime.ts
src/domain/types.ts
src/styles.css
vite.config.ts
```

This publication close-out additionally adds:

```text
.github/workflows/verify.yml   (artifact-upload step)
docs/audit-v4.1.md
docs/publication-verification-v4.1.md
evidence/uiadapt-v4.1-20260820T064329KST-run1/*.png
evidence/uiadapt-v4.1-20260820T064329KST-run2/*.png
```

No path outside the remediation worktree was edited by this mission. The two evidence directories each contain nine PNG files; they are explicit evidence artifacts, not generated source dependencies.

## Baseline before remediation

Baseline was taken at the base SHA before production-code changes in the isolated worktree.

| Command | Result | Evidence |
|---|---|---|
| `npm ci` | RC 0, 240 packages, 0 vulnerabilities | `2026-08-19T21:32:48.7877654Z`–`2026-08-19T21:32:55Z` |
| `npm run lint` | RC 0 | baseline run |
| `npm test` | 14/14 passed | baseline run |
| `npm run build` | RC 0 | baseline run |
| `npm run test:e2e` | 27/27 passed at root-path baseline | baseline run |

The root-path baseline was not treated as proof of the required `/uiadapt_demo/` deployment contract.

## TDD evidence

### P0 RED

At `2026-08-19T21:36:08.7015657Z`, the intentionally failing P0 suite returned RC 1. The failures covered the expected policy, Adaptive OFF copy isolation, product-specific purchase map, and the new type contract. This failure was recorded before implementation and was not hidden.

### P0 GREEN

At `2026-08-19T21:36:48.0578598Z`–`2026-08-19T21:37:05.6300155Z`:

- Vitest: 16/16 passed
- production build: RC 0
- Playwright: 30/30 passed

### P1 RED

At `2026-08-19T21:37:33.5154549Z`, the intentionally failing P1 suite returned RC 1: 2 unit failures and 6 E2E failures for the not-yet-created main-stage/brand/decision-support contracts. The remaining 30 E2E tests passed.

### P1 GREEN

At `2026-08-19T21:42:06.6747587Z`, Vitest 17/17 and Playwright 36/36 passed after the minimal P1 implementation and test fixes.

## Fresh verification evidence

The following fresh run was executed from the remediation source before the publication-only documentation commit. Each command was run explicitly; no old report count was reused.

| Command | Exit code | Result / output excerpt | Timestamp |
|---|---:|---|---|
| `npm ci` | 0 | 240 packages installed; 0 vulnerabilities | `2026-08-19T21:42:50Z`–`2026-08-19T21:43:02Z` |
| `npm run lint` | 0 | ESLint completed without findings | `2026-08-19T21:43:02Z` |
| `npm test` | 0 | Vitest: 17/17 passed | `2026-08-19T21:43:02Z`–`2026-08-19T21:43:09Z` |
| `npm run build` | 0 | TypeScript and Vite production build completed | `2026-08-19T21:43:09Z`–`2026-08-19T21:43:19.0720537Z` |
| `npm audit --omit=dev --audit-level=high` | 0 | `found 0 vulnerabilities` | `2026-08-19T21:43:19.0720537Z` |
| `npm run test:e2e` run 1 | 0 | 36/36 passed | `2026-08-19T21:43:19Z`–`2026-08-19T21:43:43.8717526Z` |
| `npm run test:e2e` run 2 | 0 | 36/36 passed | `2026-08-19T21:44:14Z`–`2026-08-19T21:44:38.6709680Z` |

The final publication close-out reran the same commands after this document and CI artifact step were present in the working tree. The exact final Git SHA after the documentation commit is reported separately in the agent handoff; the behavioral source remains the source SHA above.

## Browser and runtime proof

Playwright uses Chromium at all required viewports:

- 1440×900
- 1024×768
- 390×844

The E2E suite verifies direct navigation and reload at `/uiadapt_demo/`, nested JS/CSS/font asset paths, asset response status, replay execution, Adaptive ON/OFF evidence equivalence, Product Contract deep equality, COMPARE main-stage visibility, FOCUS decision support, keyboard-only actions, focus preservation, reduced motion, Pause/Resume, Stop, Reset stale-timer cancellation, manual takeover, no horizontal overflow, and collapsed diagnostics.

Fresh runtime observations:

- Console errors: 0
- Failed requests: 0
- Unintended external runtime requests: 0
- Asset failures (JS/CSS/WOFF2): 0
- Product Contract mismatch: 0
- Screenshot count per run: 9
- Screenshot hash difference between the two deterministic runs: 0

## Immutable visual evidence

The two independently captured evidence directories are not v4.0 evidence and do not overwrite it:

- `evidence/uiadapt-v4.1-20260820T064329KST-run1/`
- `evidence/uiadapt-v4.1-20260820T064329KST-run2/`

Each contains the nine required desktop, laptop, and mobile EXPLORE/COMPARE/FOCUS captures. Both runs have the same SHA-256 values:

| File | SHA-256 |
|---|---|
| `desktop-1440-compare.png` | `FFF7B7C8F1B5BAEF04337B07F58FE20C05539006D16F7C8C0788C2A224F33958` |
| `desktop-1440-explore.png` | `30E8F7DAE2FCF094501605A3E229C983651B6C98A64E16FF28BCEB6D040A70D3` |
| `desktop-1440-focus.png` | `0478F3F8B69ADAAFF78AB883397C6F54CB9B83A11153C2C083C46001D33D9850` |
| `laptop-1024-compare.png` | `777825CDBA1719E9770D5ABDBB2187CE255CF34826EDF25772D21E86BD27B627` |
| `laptop-1024-explore.png` | `D87B12063E9E4700FB8EE0E71E48A7837FAD1E7CEC5A203735CAEED8B7097131` |
| `laptop-1024-focus.png` | `A5120CA3A3A449188BB1972FC811EE026E2E2CBE97B235722DA1B634FBE5B169` |
| `mobile-390-compare.png` | `9A76DB4397A2129D25DC4019C21879D7D7BB72E3F8BD6C71B8F1501E199037F5` |
| `mobile-390-explore.png` | `05E492C756CD1BAD5051FEF63111C60BDA06F1BAE2F7199C367F0A64CBD96640` |
| `mobile-390-focus.png` | `CF80BC8BC6B10937F82869FB27010BA451441E99D9C1AF04A611F3876CDA4C68` |

The PNG files are retained as explicit evidence files and have Windows read-only attributes. A fresh run must either reproduce these hashes or report the changed files; it must not overwrite the canonical evidence silently.

## CI and audit publication

`.github/workflows/verify.yml` defines an Ubuntu latest / Node 22 job with npm cache, `npm ci`, lint, unit/component tests, production build, Playwright Chromium installation, nested-path E2E, production dependency audit with `pipefail` and `tee`, and an `actions/upload-artifact@v4` step that preserves `test-results/`, `playwright-report/`, `dist/`, and `audit-results.txt` even when an earlier step fails.

The local audit record is [audit-v4.1.md](audit-v4.1.md). It separates the production gate (`npm audit --omit=dev --audit-level=high`) from the full lockfile audit (`npm audit`). No uncontrolled `npm audit fix` was executed.

GitHub Actions has not been executed for this branch because the mission forbids push/merge and no pull request was opened. CI configuration is source-verified only; remote runner success remains unverified until an authorized PR or branch run exists.

## Final close-out command receipt

These are the fresh command boundaries from the final source close-out. All commands returned RC 0.

| Command | Start | End | Result |
|---|---|---|---|
| `npm ci` | `2026-08-20T06:50:49.5315317+09:00` | `2026-08-20T06:51:05.9706983+09:00` | 240 packages installed; 0 vulnerabilities |
| `npm run lint` | `2026-08-20T06:51:09.1780096+09:00` | `2026-08-20T06:51:11.7813814+09:00` | ESLint clean |
| `npm test` | `2026-08-20T06:51:15.0752121+09:00` | `2026-08-20T06:51:18.4077497+09:00` | 17/17 passed |
| `npm run build` | `2026-08-20T06:51:21.7522955+09:00` | `2026-08-20T06:51:24.1001500+09:00` | Vite production build complete |
| `npm run test:e2e` | `2026-08-20T06:51:27.9923561+09:00` | `2026-08-20T06:51:48.5227228+09:00` | 36/36 passed; nested preview URL correct |
| `npm audit --omit=dev --audit-level=high` | `2026-08-20T06:51:53.1528917+09:00` | `2026-08-20T06:51:54.0757764+09:00` | `found 0 vulnerabilities` |
| `npm audit` | `2026-08-20T06:53:52.1611046+09:00` | `2026-08-20T06:53:53.1495534+09:00` | `found 0 vulnerabilities` |
| `git diff --check` | `2026-08-20T06:54:13.5389432+09:00` | `2026-08-20T06:54:13.5812554+09:00` | clean, RC 0 |

The E2E process printed Node's `NO_COLOR`/`FORCE_COLOR` warning from the test runner. It did not produce a test failure, browser console error, failed request, or external runtime request.

## Security and privacy boundary

Source inspection and E2E checks found no secret, API key, authentication token, analytics call, real payment path, personal-data transmission, runtime external API, arbitrary HTML injection, or CDN runtime dependency. The artifact is a local static demo. Server-level HTTPS and response headers remain hosting controls outside this repository; recommended controls are HTTPS redirect, CSP, `X-Content-Type-Options: nosniff`, Referrer-Policy, and Permissions-Policy.

## Product clarity and residual limitations

`PRODUCT_CLARITY = NOT_VERIFIED`: the required three-person, non-developer, 30-second test was not performed. No human responses are simulated. This is a product-approval limitation, not a claim of failure in the automated contract.

Additional evidence-backed limitations:

- Only Chromium was exercised; Firefox and WebKit were not claimed.
- The local nested-path build was verified; live `uiadapt.com` deployment was not touched or claimed.
- The historical v4.0 dirty-root attribution remains `UNAVAILABLE`; unrelated Grafana files were not modified or cleaned.
- The 21-second FOCUS transition follows the fixed event thresholds; the source report records this timing interpretation rather than inventing a 25-second hidden rule.

## Independent reviewer command contract

From a clean checkout of the remediation branch, run:

```powershell
Set-Location E:\03_AllWork\grafana\park-web-demo-v4.1
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=high
npm audit
git diff --check
git status --short --branch
git log -1 --oneline
```

The independent reviewer must compare the current source, lockfile, changed paths, raw command output, screenshots, and this document. The reviewer owns the final PASS/REMAND decision.
