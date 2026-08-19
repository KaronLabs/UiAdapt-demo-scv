# UIAdapt Adaptive Storefront Theater v4.0

동일한 상품 카탈로그와 동일한 행동 입력을 사용하면서, Adaptive UI가 정보의 배치와 강조만 바꾸는 로컬 데모입니다.

> Recommendation decides WHAT. UIAdapt decides HOW.

## 실행 환경

- Node.js `v22.21.1`
- npm `11.11.0`
- 로컬 바인딩: `127.0.0.1` 전용
- 런타임 외부 API, 분석 도구, 이미지·폰트 CDN: 사용하지 않음

## 실행

```powershell
npm ci
npm run dev
```

개발 서버 기본 주소는 `http://127.0.0.1:5173`입니다.

Production build와 preview:

```powershell
npm run build
npm run preview
```

Preview 주소는 `http://127.0.0.1:8766`입니다.

## 검증

```powershell
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright는 Chromium에서 `1440×900`, `1024×768`, `390×844`를 검증합니다. 테스트는 canonical product text, Replay 상태 전이, Adaptive OFF의 감지/적용 분리, focus 보존, 가로 overflow, console error, 외부 네트워크 요청을 검사합니다.

## 결정론적 상태 규칙

- 최근 8개 product-targeted event만 사용합니다.
- 자동 전이는 `EXPLORE → COMPARE → FOCUS` 방향으로만 진행합니다.
- 전이 사이에는 virtual clock 기준 3,000ms dwell을 적용합니다.
- Adaptive OFF도 state와 evidence를 계속 계산하고, presentation만 `EXPLORE`로 고정합니다.
- Replay 중 수동 입력은 script를 중지한 뒤 사용자 event로 기록합니다.

## 명세 해석 기록

원래 timeline 표는 FOCUS 전이를 25초로 적었으나, 고정 임계식인 `최근 8개 중 dominant product 6개 이상 + share 0.75 이상 + purchase-support signal 1개 이상`은 21초의 `SELECT_COLOR` event에서 이미 참이 됩니다. 본 구현은 임계식을 변경하거나 숨은 예외를 추가하지 않고 FOCUS를 21초에 적용합니다. 25초의 `ADD_TO_CART`는 최종 서사를 강화하지만 최초 FOCUS 전이 시점은 아닙니다.

## 검증 경계

자동시험과 실제 브라우저 렌더 검수는 완료했습니다. 구현에 참여하지 않은 비개발자 3명의 30초 시험은 자동화할 수 없으므로 `Product clarity: NOT VERIFIED`로 남깁니다. 최종 승인과 PASS는 구현자가 아닌 별도 검증자가 판단해야 합니다.
