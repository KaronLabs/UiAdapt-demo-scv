join pplar39

# UIAdapt Investor Stage

**Live Demo:** [https://lagacy-ser.tail645adc.ts.net/uiadapt_demo/](https://lagacy-ser.tail645adc.ts.net/uiadapt_demo/)

UIAdapt는 추천 결과를 바꾸는 엔진이 아니라, 관찰된 행동 분포에 맞춰 같은 정보를 탐색·비교·결정지원 형태로 재구성하는 Adaptive UI infrastructure 데모입니다.

> Same catalog · Same behavior · Different presentation

첫 화면의 `Behavior → State → Policy → Interface` 인과선과 결정론적 27초 Replay가 이 계약을 보여줍니다. UIAdapt는 기술 계층이며 Atelier Audio는 샘플 상점입니다. 상품 ID·가격·평점·리뷰·배송·재고·색상은 EXPLORE, COMPARE, PURCHASE_INTENT와 Adaptive ON/OFF 사이에서 변하지 않습니다.

## 화면과 런타임

- 사용자용 제목·본문·버튼: 로컬 `Wanted Sans Variable`
- 상태·근거·진단: 로컬 `IBM Plex Mono`
- 원격 폰트·이미지·analytics 요청: 없음
- telemetry API: same-origin `/api/uiadapt/*`를 통해 선택적으로 기록하며, API/DB 장애는 화면 판단을 바꾸지 않음
- 정적 공개 빌드: `VITE_UIADAPT_TELEMETRY_MODE=disabled npm run build:nwg`를 사용하면 Developer View에 `DISABLED`가 표시되고 세션·trajectory 요청을 보내지 않음. 기본 빌드는 기존 telemetry 동작을 유지함
- 상태 흐름: `EXPLORE → COMPARE → PURCHASE_INTENT`
- `PURCHASE_INTENT`는 구매 완료가 아니라 결정에 가까운 행동 분포 상태임
- Adaptive OFF: detected state는 계산하되 presentation은 EXPLORE로 유지
- 기본 개발 주소: `http://127.0.0.1:5173/uiadapt_demo/`
- production preview: `http://127.0.0.1:8766/uiadapt_demo/`

Wanted Sans는 [공식 저장소](https://github.com/wanteddev/wanted-sans/blob/main/packages/wanted-sans/README.md)의 가변 WOFF2를 패키지에 고정해 번들합니다.

## 실행

```powershell
npm run dev
```

## 전체 검증 순서

깨끗한 checkout에서 아래 순서를 그대로 실행합니다. `test:deployment`는 자체 temporary root와 dynamic ports만 사용하며, `never stages, cleans, or writes projectRoot/www`를 계약으로 고정합니다. 운영 release도 변경하지 않습니다.

```powershell
npm ci
npm run lint
npm test
npm run test:api
npm run test:gateway
npm run test:deployment
npm run verify:build-bases
npm run build
npm run build:nwg
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

Playwright는 Chromium의 `1440×900`, `1024×768`, `390×844`에서 nested assets, 로컬 폰트, Replay, product invariant, Adaptive OFF, COMPARE/PURCHASE_INTENT, Developer View 분포 증거, focus 보존, overflow, console 및 network hygiene를 검사합니다. MySQL integration은 live 환경이 아니라 GitHub Actions의 disposable MySQL 8 service에서만 실행합니다.

## Distribution Engine v1

브라우저의 pure TypeScript domain engine만 상태 판단 권한을 가집니다.

- 차원: `BROWSE`, `DETAIL`, `COMPARE`, `DECISION`, `CART_INTENT`
- 최근 20개 이벤트의 분포와 reference `{0.50, 0.20, 0.15, 0.10, 0.05}` 비교
- 변화량: `clamp(sum(abs(current - reference)) / 2, 0, 1)`; threshold에는 반올림 전 raw score 사용
- 최소 evidence 15개, 진입 `>= 0.30`, EXPLORE 복귀 `< 0.20`, 동일 candidate persistence 3회
- 48개 deterministic replay event가 27초 동안 `EXPLORE → COMPARE → PURCHASE_INTENT`를 유도하며 상태를 직접 주입하지 않음
- Adaptive OFF에서도 detected evidence는 진행하고 applied presentation만 `EXPLORE`로 유지

## Persistent demo telemetry

`db/001-uiadapt-demo.sql`은 `uiadapt_sessions`, `uiadapt_events`, `uiadapt_distribution_snapshots`, `uiadapt_transitions` 네 개의 InnoDB/utf8mb4 table만 정의합니다. `server/uiadapt-api.mjs`는 `127.0.0.1:4181`에만 bind하며, gateway가 `/api/uiadapt/*`만 고정 route합니다. MySQL은 raw event·분포 snapshot·transition을 기록할 뿐 알고리즘을 실행하지 않습니다.

브라우저 telemetry queue는 FIFO 128개 bounded buffer, 최대 3 attempts, 100/250/500ms retry budget을 사용합니다. overflow는 새 frame을 거부하고 `OVERFLOW`, retry exhaustion은 `DEGRADED`로 Developer View에 노출합니다. 어느 경우에도 local reducer event나 state transition을 되돌리지 않습니다. 운영 credential은 systemd `LoadCredential` 파일 계약이며 public 3306, live provisioning, main merge, R9 live deployment는 이 source mission 범위에 없습니다.

## 운영 문서

- NWG 릴리스·검증·롤백: [`docs/investor-stage-nwg-release.md`](docs/investor-stage-nwg-release.md)
- 공개 preview 위협 모델: [`docs/security/investor-preview-threat-model.md`](docs/security/investor-preview-threat-model.md)

비개발자 3인의 30초 설명 시험은 자동 검증 대상이 아닙니다. 실제 수행 전 상태는 `PRODUCT_CLARITY = NOT_VERIFIED`입니다.
