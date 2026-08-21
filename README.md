# UIAdapt Investor Stage

UIAdapt는 추천 결과를 바꾸는 엔진이 아니라, 관찰된 행동에 맞춰 같은 정보를 탐색·비교·결정지원 형태로 재구성하는 Adaptive UI infrastructure 데모입니다.

> Same catalog · Same behavior · Different presentation

첫 화면의 `Behavior → State → Policy → Interface` 인과선과 결정론적 27초 Replay가 이 계약을 보여줍니다. UIAdapt는 기술 계층이며 Atelier Audio는 샘플 상점입니다. 상품 ID·가격·평점·리뷰·배송·재고·색상은 EXPLORE, COMPARE, FOCUS와 Adaptive ON/OFF 사이에서 변하지 않습니다.

## 화면과 런타임

- 사용자용 제목·본문·버튼: 로컬 `Wanted Sans Variable`
- 상태·근거·진단: 로컬 `IBM Plex Mono`
- 원격 폰트·이미지·API·analytics 요청: 없음
- 상태 흐름: `EXPLORE → COMPARE → FOCUS`
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
npm run test:gateway
npm run test:deployment
npm run verify:build-bases
npm run build
npm run build:nwg
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

Playwright는 Chromium의 `1440×900`, `1024×768`, `390×844`에서 nested assets, 로컬 폰트, Replay, product invariant, Adaptive OFF, COMPARE/FOCUS, focus 보존, overflow, console 및 network hygiene를 검사합니다.

## 운영 문서

- NWG 릴리스·검증·롤백: [`docs/investor-stage-nwg-release.md`](docs/investor-stage-nwg-release.md)
- 공개 preview 위협 모델: [`docs/security/investor-preview-threat-model.md`](docs/security/investor-preview-threat-model.md)

비개발자 3인의 30초 설명 시험은 자동 검증 대상이 아닙니다. 실제 수행 전 상태는 `PRODUCT_CLARITY = NOT_VERIFIED`입니다.
