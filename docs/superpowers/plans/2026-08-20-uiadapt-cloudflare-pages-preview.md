# UIAdapt Cloudflare Pages 외부 감사 배포 계획

## 요약

- GitHub 저장소 `KaronLabs/UiAdapt-demo-scv`의 `fix/uiadapt-v4.1-product-contract` 브랜치를 Cloudflare Pages Preview로 공개한다.
- `main`, 기존 `uiadapt.com`, NWG 서버는 변경하지 않는다.
- 기존 `/uiadapt_demo/` 빌드 계약을 보존하고 Cloudflare Pages 전용 루트(`/`) 빌드를 별도 제공한다.

## 구현 계약

1. `npm run build`는 Vite 기본값 `/uiadapt_demo/`를 계속 사용한다.
2. `npm run build:pages`는 TypeScript 검사 후 `vite build --base=/`를 실행한다.
3. 자동 검증은 일반 빌드의 HTML 자산 URL이 `/uiadapt_demo/assets/`, Pages 빌드의 자산 URL이 `/assets/`로 시작하는지 확인한다.
4. Cloudflare 설정은 Vite, Node.js 22, `npm run build:pages`, 출력 디렉터리 `dist`를 사용한다.
5. Production branch는 `main`, 감사 대상은 `fix/uiadapt-v4.1-product-contract`의 Preview Deployment다.

## 배포 및 검증 계약

- 실제 Preview에서 직접 접근과 새로고침, JS/CSS/폰트/SVG 응답, 콘솔 오류, 실패 요청, 외부 런타임 요청을 검사한다.
- Watch UIAdapt와 EXPLORE→COMPARE→FOCUS, Adaptive OFF, Pause/Resume/Stop/Reset을 확인한다.
- 1440×900, 1024×768, 390×844 viewport를 확인한다.
- 배포 commit SHA, deployment ID, Preview URL, 시각과 build log를 기록한다.
- 실제 배포 SHA가 감사 대상 SHA와 다르거나 자산 404가 있으면 실패다.

## 완료 기준과 기본값

- 공개 방식은 `pages.dev`, 배포 등급은 외부 감사용 Preview다.
- 사용자 도메인과 Production 배포는 제외한다.
- Cloudflare 공식 Git Integration을 사용하며 인증 권한이 없으면 우회하지 않고 `AUTHORIZATION_BLOCKED`로 보고한다.
- 결과 상태는 `READY_FOR_EXTERNAL_AUDIT`이며 실제 사용자 시험 전 `PRODUCT_CLARITY=NOT_VERIFIED`를 유지한다.
