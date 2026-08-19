# UIAdapt v4.0 구현 검증 보고서

## 상태

`READY_FOR_INDEPENDENT_REVIEW`

이 문서는 구현 결과를 기록하며 최종 승인 또는 PASS를 선언하지 않습니다.

## 구현 요약

- React, TypeScript, Vite 기반의 독립 로컬 프로젝트 구성
- immutable canonical catalog와 순수 feature/state/policy/reducer 구현
- EXPLORE, COMPARE, FOCUS의 Acoustic Atelier presentation 구현
- Adaptive ON/OFF가 동일한 behavior evidence와 detected state를 공유하도록 구현
- 27초 Replay와 Pause, Resume, Stop, Reset, manual takeover 구현
- 로컬 SVG 상품 아트, 로컬 번들 폰트, reduced-motion, focus 보존 구현
- 기본 닫힘 상태의 Why inspector와 Developer View 구현

## 명세 불일치 해석

FOCUS의 고정 임계값은 21초 `SELECT_COLOR`에서 충족됩니다. timeline의 25초 기대와 동시에 만족할 수 없으므로 상태 수학을 우선하여 21초 전이를 canonical 결과로 사용했습니다. 숨은 예외나 event type별 가중치는 추가하지 않았습니다.

## 구현자 검증 결과

| 검증 | 결과 |
|---|---|
| ESLint | PASS |
| Vitest unit/component | PASS, 14 tests |
| Production build | PASS |
| Playwright E2E | PASS, 27 tests / 3 viewports |
| Desktop 실제 브라우저 EXPLORE/COMPARE/FOCUS 렌더 | PASS |
| Mobile 390×844 실제 브라우저 렌더 | PASS, horizontal overflow 0 |
| Console error | 0 |
| 외부 runtime request | 0 |
| Product clarity 사용자 시험 | NOT VERIFIED |

최종 전체 재현은 `2026-08-19T18:23:54.8519961Z`부터 `2026-08-19T18:24:18.7198034Z`까지 실행했으며 RC 0으로 종료했습니다. `npm ci`는 240개 package를 설치하고 알려진 취약점 0건을 보고했습니다.

직전 첫 시도는 실행 중인 preview가 `rolldown-binding.win32-x64-msvc.node`를 점유하여 `npm ci`가 `EPERM`으로 실패했습니다. preview를 종료한 뒤 처음부터 재실행하여 통과했습니다. Windows에서 `npm ci`를 재현할 때는 dev/preview 프로세스를 먼저 종료해야 합니다.

독립 검증 1차는 자동시험 perimeter와 증거 계약 부족으로 `REMAND`였습니다. 교정 후 구현자 재현에서 Vitest 14건과 Playwright 27건이 통과했습니다. 추가된 검증은 순수 `derivePolicy` 6개 조합, 전체 Product Contract, 10회 전체 sequence, step별 ON/OFF evidence, navigation 이전 network 감시, failed request, keyboard-only, reduced-motion 0초, Pause/Resume, Stop, Reset stale timer, manual takeover timer 취소를 포함합니다. Playwright 최종 확인은 `2026-08-19T18:32:33.9823177Z`부터 `2026-08-19T18:32:45.7825814Z`까지 RC 0이었습니다.

## 재현 명령

```powershell
Set-Location E:\03_AllWork\grafana\park-web-demo
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
npm run preview
```

## 독립 검증자가 확인할 항목

1. 현재 source와 `package-lock.json`에서 위 명령을 다시 실행합니다.
2. `src/domain/runtime.ts`의 상태 수학과 `src/domain/runtime.test.ts`의 fixture를 대조합니다.
3. ON/OFF가 같은 Replay event 배열을 공유하는지 확인합니다.
4. Replay를 10회 파생한 state/feature/policy sequence가 event ID를 제외하고 동일한지 확인합니다.
5. `e2e/storefront.spec.ts`가 실제 DOM, focus, viewport, network, console을 검사하는지 확인합니다.
6. `git status --short --untracked-files=all`에서 신규 파일이 `park-web-demo` 안에만 있는지 확인합니다.
7. 비개발자 3명의 30초 시험이 수행되지 않았으므로 제품 명확성 완료를 승인하지 않습니다.

## 작업 경계 증거 한계

- Git HEAD: `2a1f403feb970c4a80e489da01b13e488b55c662`
- 현재 Git status에서 `park-web-demo`는 source/docs/receipt 28개와 immutable screenshot 9개, 합계 37개 신규 untracked 파일입니다.
- 저장소 전체에는 대상 외 dirty/untracked 항목 118개가 존재합니다. 이 항목들은 수정하거나 정리하지 않았습니다.
- 구현 전 dirty-root 전체 baseline을 봉인하지 않았으므로 `change attribution baseline: UNAVAILABLE`입니다. 따라서 사후 현재 status만으로 대상 밖 변경의 작성 주체를 증명하지 않습니다.
- 현재 source inventory와 SHA-256, lock hash, screenshot hash는 `docs/evidence-receipt.md`에 기록합니다.

## 남은 위험

- Product clarity는 실제 비개발자 3명 시험 전까지 검증되지 않았습니다.
- Chromium 이외의 실제 브라우저 호환성은 주장하지 않습니다.
- Replay는 브라우저 timer 지연에도 event의 virtual timestamp를 사용하지만, 극단적인 background throttling에서 27초의 실제 벽시계 체감은 늘어날 수 있습니다.
- 폰트 패키지는 여러 subset asset을 build에 포함하므로 정적 산출물 크기를 더 줄일 여지가 있습니다.
