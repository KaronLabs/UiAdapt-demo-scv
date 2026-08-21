# UIAdapt Investor Stage NWG 릴리스 운영 계약

이 문서는 현재 저장소에서 확인되는 정적 build, password gateway, systemd unit과 2026-08-21 런타임 영수증을 설명합니다. 자동 배포 스크립트가 아니며 비밀번호를 포함하지 않습니다.

## 1. 배포 구조

```text
Internet
  → Tailscale Funnel :443 (Tailscale daemon이 TLS 종료)
  → password gateway 127.0.0.1:4180
  → static service 127.0.0.1:5173
  → current/www/uiadapt_demo/
```

- immutable release: `/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo/releases/<SHA>`
- active pointer: `/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo/current`
- static unit: `uiadapt-static.service`
- gateway unit: `uiadapt-gateway.service`
- 두 unit은 `User=ubuntu`, `Group=ubuntu`로 실행되고 loopback에만 bind합니다.
- Funnel은 공용 HTTPS/TLS와 로컬 gateway 전달을 담당합니다. 애플리케이션 저장소는 외부 TLS 인증서나 Funnel 정책을 관리하지 않습니다.

관련 공식 문서:

- [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel)
- [tailscale funnel CLI](https://tailscale.com/docs/reference/tailscale-cli/funnel)
- [systemd.exec credentials](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html#Credentials)
- [serve](https://github.com/vercel/serve)

## 2. 소스 검증과 패키징

배포 전 깨끗한 checkout에서 다음 순서를 실행합니다.

```text
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

`npm run build:nwg`는 Vite nested build를 `www/uiadapt_demo/`에 stage합니다. 이 명령은 배포 패키지를 만드는 명령이지 운영 `current`에서 실행하는 in-place upgrade가 아닙니다.

### `test:deployment` 비파괴 계약

- integration은 OS `temporary root` 아래에 전용 `www`와 credential fixture를 만듭니다.
- `projectRoot/www`를 integration staging 또는 cleanup 대상으로 사용하는 것은 금지합니다.
- 실제 `releases/<SHA>`와 `current`는 읽기·쓰기·삭제하지 않습니다.
- production static service의 `127.0.0.1:5173`과 충돌하지 않도록 static과 gateway 모두 dynamic port를 예약합니다.
- 실패 후에도 삭제 대상은 테스트가 소유한 temporary root 아래로 제한합니다.
- 회귀시험은 프로젝트 `www` tree hash와 sentinel bytes가 전후 동일한지 검사합니다.

## 3. 원자적 릴리스

1. 검증한 exact Git SHA를 `releases/<SHA>.staging`에 전송하고 source/archive hash를 대조합니다.
2. production dependency 설치와 unit 검증이 끝나면 staging을 `releases/<SHA>`로 rename합니다.
3. `current.new` symlink를 새 release로 만들고 `current`로 원자 교체합니다.
4. `systemctl daemon-reload` 후 static, gateway 순서로 재시작합니다.
5. 기존 release는 rollback이 끝날 때까지 삭제하지 않습니다.

## 4. Credential 계약과 rotation

- source credential: `/etc/uiadapt-demo/password`
- metadata: owner/group `root:root`, mode `0600`
- systemd `LoadCredential`가 읽기 전용 런타임 사본을 gateway에 제공합니다.
- 비밀번호를 Git, unit, process command line에 넣지 않습니다.
- secret must not appear in application or deployment log output.
- rotation은 새 credential 파일을 root 권한으로 원자 교체한 뒤 `uiadapt-gateway.service`만 재시작하고, 이전/새 credential의 음성·양성 인증 결과를 확인합니다.
- 짧은 공유 비밀번호는 허용된 잔존 위험이며 외부 감사 종료 후 강한 값으로 교체합니다.

## 5. Readiness, authentication, public smoke

systemd의 `active`만으로 readiness를 선언하지 않습니다.

1. static listener와 `/uiadapt_demo/`의 HTML·JS·CSS·WOFF2 HTTP 200을 확인합니다.
2. gateway 무인증 및 잘못된 authentication은 401, 올바른 authentication은 nested HTML 200, 인증된 `/`은 302를 확인합니다.
3. public smoke에서 HTTPS 200, Replay의 COMPARE/FOCUS, console error 0, failed/외부 runtime request 0을 확인합니다.
4. `current` symlink target과 검증한 Git SHA가 일치하는지 다시 확인합니다.

## 6. Rollback

readiness, authentication 또는 public smoke가 하나라도 실패하면 `success`를 선언하지 않습니다. `current`를 직전 정상 `releases/<SHA>`로 원자 교체하고 static과 gateway를 재시작한 뒤 동일 검증을 반복합니다. 최초 배포라 이전 release가 없으면 새 unit과 Funnel :443만 중지하며, 실패 release와 로그는 감사 증거로 보존합니다.

## 7. 측정된 상태와 현재 작업 경계

2026-08-21 R3 증거에서 nwg `current`는 `fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91`을 가리켰고 두 서비스, 로컬/공개 인증, Funnel 경로가 통과했습니다. 이는 해당 시각의 측정값이며 현재 상태를 영구 보증하지 않습니다.

이 문서가 포함된 R8 remediation은 live server에 배포하지 않았습니다: `R8_NOT_DEPLOYED`. 원격 runtime을 다시 측정하기 전에는 R8 배포 성공을 주장하지 않습니다.

## 8. 잔존 한계

- Tailscale Funnel은 beta이고 비구성형 bandwidth limit가 있는 외부 운영 의존성입니다.
- full host reboot는 수행하지 않았습니다. enable 상태와 개별 service restart만 검증했습니다.
- application-layer rate limiter와 전용 service user는 없습니다.
- 3인 제품 명확성 시험은 `PRODUCT_CLARITY = NOT_VERIFIED`입니다.
- main merge와 자동 배포는 이 운영 계약의 범위 밖입니다.
