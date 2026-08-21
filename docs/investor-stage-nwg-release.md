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

- version-addressed release: `/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo/releases/<SHA>`
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
- `never stages, cleans, or writes projectRoot/www`: 실제 project tree는 존재 여부와 hash를 읽어 전후 비교할 뿐입니다.
- `projectRoot/www`를 integration staging 또는 cleanup 대상으로 사용하는 것은 금지합니다. 외부 probation test가 준비한 sentinel도 test runner는 읽기만 합니다.
- 실제 `releases/<SHA>`와 `current`는 읽기·쓰기·삭제하지 않습니다.
- production static service의 `127.0.0.1:5173`과 충돌하지 않도록 static과 gateway 모두 dynamic port를 예약합니다.
- 실패 후에도 삭제 대상은 테스트가 소유한 temporary root 아래로 제한합니다.
- 회귀시험은 프로젝트 `www` tree의 존재 여부와 hash가 전후 동일한지 검사합니다.

## 3. Version-addressed 릴리스와 원자적 pointer 교체

1. 검증한 exact Git SHA를 `releases/<SHA>.staging`에 전송하고 deployment-time archive/manifest hash verification을 수행합니다.
2. production dependency 설치와 unit 검증이 끝나면 staging을 `releases/<SHA>`로 rename합니다.
3. `current.new` symlink를 새 release로 만들고 `current`로 원자 교체합니다.
4. `systemctl daemon-reload` 후 static, gateway 순서로 재시작합니다.
5. 기존 release는 rollback이 끝날 때까지 삭제하지 않습니다.

SHA 기반 directory 이름은 내용 변경을 기술적으로 차단하지 않습니다. `no filesystem immutable bit` 및 `no root-owned read-only enforcement`가 현재 증명된 상태입니다. release tree와 service는 `ubuntu`가 소유·실행할 수 있으므로 `ubuntu ownership is a residual risk`입니다.

### Automated fail-closed switch

다음 Bash 전체를 **한 shell process에서** 실행합니다. 새 release는 이미 전송·hash 검증된 상태여야 합니다. `ERR` trap은 pointer 교체 전에 설치되며 switch, restart, readiness 또는 인증 smoke 중 하나라도 실패하면 같은 shell이 캡처한 `PREVIOUS_TARGET`으로 복구합니다. 비밀번호 값은 argv·stdout·shell trace에 나타나지 않습니다.

```bash
set -Eeuo pipefail
set +x

DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
CREDENTIAL_FILE="/etc/uiadapt-demo/password"
PUBLIC_URL="https://00-new-world-gpu.tail645adc.ts.net/uiadapt_demo/"
NEW_SHA="${NEW_SHA:?set the exact 40-character lowercase Git SHA}"

test "$(id -u)" -eq 0
test -d "$DEPLOY_ROOT/releases"
test -L "$DEPLOY_ROOT/current"
printf '%s\n' "$NEW_SHA" | grep -Eq '^[0-9a-f]{40}$'

NEW_RELEASE="$DEPLOY_ROOT/releases/$NEW_SHA"
test -d "$NEW_RELEASE"
test "$(stat -c %d "$DEPLOY_ROOT")" = "$(stat -c %d "$NEW_RELEASE")"

PREVIOUS_TARGET="$(readlink -f "$DEPLOY_ROOT/current")"
case "$PREVIOUS_TARGET" in
  "$DEPLOY_ROOT"/releases/*) ;;
  *) printf 'refusing unexpected current target\n' >&2; exit 1 ;;
esac
test -d "$PREVIOUS_TARGET"
test "$(stat -c %d "$DEPLOY_ROOT")" = "$(stat -c %d "$PREVIOUS_TARGET")"
test ! -e "$DEPLOY_ROOT/current.new"
test ! -L "$DEPLOY_ROOT/current.new"
test ! -e "$DEPLOY_ROOT/current.rollback.new"
test ! -L "$DEPLOY_ROOT/current.rollback.new"
test -r "$CREDENTIAL_FILE"

auth_smoke() {
  UIADAPT_SMOKE_PASSWORD_FILE="$CREDENTIAL_FILE" \
  UIADAPT_SMOKE_URL="$1" \
  node <<'NODE'
const { readFileSync } = require("node:fs");
const http = require("node:http");
const https = require("node:https");

const raw = readFileSync(process.env.UIADAPT_SMOKE_PASSWORD_FILE, "utf8");
const password = raw.endsWith("\r\n") ? raw.slice(0, -2)
  : raw.endsWith("\n") ? raw.slice(0, -1)
    : raw;
if (password.length === 0) process.exit(2);
const timeoutMs = Number(process.env.UIADAPT_SMOKE_TIMEOUT_MS ?? "10000");
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) process.exit(2);

const target = new URL(process.env.UIADAPT_SMOKE_URL);
const transport = target.protocol === "https:" ? https : http;
const authorization = `Basic ${Buffer.from(`reviewer:${password}`).toString("base64")}`;
const request = transport.request(target, {
  headers: { authorization },
  signal: AbortSignal.timeout(timeoutMs),
}, (response) => {
  response.resume();
  response.on("end", () => {
    const status = response.statusCode ?? 0;
    console.log(`AUTH_STATUS=${status}`);
    if (status !== 200) process.exitCode = 1;
  });
});
request.on("error", () => {
  console.log("AUTH_STATUS=0");
  process.exitCode = 1;
});
request.end();
NODE
}

wait_for_readiness() {
  local max_attempts="${1:-20}"
  local poll_seconds="${2:-0.5}"
  local attempt
  case "$max_attempts" in
    ''|*[!0-9]*) printf 'invalid readiness attempt bound\n' >&2; return 2 ;;
  esac
  test "$max_attempts" -gt 0 || { printf 'invalid readiness attempt bound\n' >&2; return 2; }
  for ((attempt=1; attempt<=max_attempts; attempt++)); do
    if systemctl is-active --quiet uiadapt-static.service &&
      systemctl is-active --quiet uiadapt-gateway.service &&
      curl --connect-timeout 1 --max-time 2 \
        --fail --silent \
        http://127.0.0.1:5173/uiadapt_demo/ \
        --output /dev/null &&
      test "$(curl --connect-timeout 1 --max-time 2 \
        --silent --output /dev/null --write-out '%{http_code}' \
        http://127.0.0.1:4180/uiadapt_demo/)" = "401"; then
      return 0
    fi
    if test "$attempt" -lt "$max_attempts"; then
      sleep "$poll_seconds"
    fi
  done
  printf 'services did not become ready after %s attempts\n' "$max_attempts" >&2
  return 1
}

smoke() {
  test "$(readlink -f "$DEPLOY_ROOT/current")" = "$NEW_RELEASE"
  systemctl is-active --quiet uiadapt-static.service
  systemctl is-active --quiet uiadapt-gateway.service
  curl --connect-timeout 3 --max-time 10 \
    --fail --silent --show-error \
    http://127.0.0.1:5173/uiadapt_demo/ \
    --output /dev/null
  test "$(curl --connect-timeout 3 --max-time 10 \
    --silent --output /dev/null --write-out '%{http_code}' \
    http://127.0.0.1:4180/uiadapt_demo/)" = "401"
  auth_smoke "http://127.0.0.1:4180/uiadapt_demo/"
  auth_smoke "$PUBLIC_URL"
}

rollback() {
  local failure_status=$?
  trap - ERR
  set +e
  printf 'switch failed; restoring previous release\n' >&2
  if test -e "$DEPLOY_ROOT/current.rollback.new" || test -L "$DEPLOY_ROOT/current.rollback.new"; then
    printf 'rollback staging path unexpectedly exists\n' >&2
    exit "$failure_status"
  fi
  ln -s "$PREVIOUS_TARGET" "$DEPLOY_ROOT/current.rollback.new" || exit "$failure_status"
  test "$(readlink -f "$DEPLOY_ROOT/current.rollback.new")" = "$PREVIOUS_TARGET" || exit "$failure_status"
  mv -T "$DEPLOY_ROOT/current.rollback.new" "$DEPLOY_ROOT/current" || exit "$failure_status"
  systemctl daemon-reload || exit "$failure_status"
  systemctl restart uiadapt-static.service uiadapt-gateway.service || exit "$failure_status"
  wait_for_readiness || exit "$failure_status"
  test "$(readlink -f "$DEPLOY_ROOT/current")" = "$PREVIOUS_TARGET" || exit "$failure_status"
  systemctl is-active --quiet uiadapt-static.service || exit "$failure_status"
  systemctl is-active --quiet uiadapt-gateway.service || exit "$failure_status"
  curl --connect-timeout 3 --max-time 10 \
    --fail --silent --show-error \
    http://127.0.0.1:5173/uiadapt_demo/ \
    --output /dev/null || exit "$failure_status"
  exit "$failure_status"
}

trap 'rollback' ERR
ln -s "releases/$NEW_SHA" "$DEPLOY_ROOT/current.new"
test "$(readlink -f "$DEPLOY_ROOT/current.new")" = "$NEW_RELEASE"
mv -T "$DEPLOY_ROOT/current.new" "$DEPLOY_ROOT/current"
systemctl daemon-reload
systemctl restart uiadapt-static.service uiadapt-gateway.service
wait_for_readiness
smoke
trap - ERR
printf 'SWITCH_STATUS=PASS\n'
```

Node helper는 gateway와 동일하게 terminal CRLF 한 번 또는 LF 한 번만 제거하고 나머지 문자를 보존합니다. credential file을 직접 읽어 메모리에서 Basic header를 만들며 출력은 `AUTH_STATUS=<code>`뿐입니다.

### Manual rollback

자동 trap 이후 운영자가 다른 이전 release로 되돌려야 할 때는 새 shell에서 아래 recipe를 사용합니다. prior shell 변수에 의존하지 않고 `ROLLBACK_SHA`에서 target을 다시 계산·검증합니다.

```bash
set -Eeuo pipefail
set +x

DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
CREDENTIAL_FILE="/etc/uiadapt-demo/password"
PUBLIC_URL="https://00-new-world-gpu.tail645adc.ts.net/uiadapt_demo/"
ROLLBACK_SHA="${ROLLBACK_SHA:?set the exact prior 40-character lowercase Git SHA}"

test "$(id -u)" -eq 0
test -d "$DEPLOY_ROOT/releases"
test -L "$DEPLOY_ROOT/current"
test -r "$CREDENTIAL_FILE"
printf '%s\n' "$ROLLBACK_SHA" | grep -Eq '^[0-9a-f]{40}$'

CURRENT_TARGET="$(readlink -f "$DEPLOY_ROOT/current")"
case "$CURRENT_TARGET" in
  "$DEPLOY_ROOT"/releases/*) ;;
  *) printf 'refusing unexpected current target\n' >&2; exit 1 ;;
esac

ROLLBACK_TARGET="$DEPLOY_ROOT/releases/$ROLLBACK_SHA"
test -d "$ROLLBACK_TARGET"
test "$(stat -c %d "$DEPLOY_ROOT")" = "$(stat -c %d "$ROLLBACK_TARGET")"

manual_auth_smoke() {
  UIADAPT_SMOKE_PASSWORD_FILE="$CREDENTIAL_FILE" \
  UIADAPT_SMOKE_URL="$1" \
  node <<'NODE'
const { readFileSync } = require("node:fs");
const http = require("node:http");
const https = require("node:https");

const raw = readFileSync(process.env.UIADAPT_SMOKE_PASSWORD_FILE, "utf8");
const password = raw.endsWith("\r\n") ? raw.slice(0, -2)
  : raw.endsWith("\n") ? raw.slice(0, -1)
    : raw;
if (password.length === 0) process.exit(2);
const timeoutMs = Number(process.env.UIADAPT_SMOKE_TIMEOUT_MS ?? "10000");
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) process.exit(2);

const target = new URL(process.env.UIADAPT_SMOKE_URL);
const transport = target.protocol === "https:" ? https : http;
const authorization = `Basic ${Buffer.from(`reviewer:${password}`).toString("base64")}`;
const request = transport.request(target, {
  headers: { authorization },
  signal: AbortSignal.timeout(timeoutMs),
}, (response) => {
  response.resume();
  response.on("end", () => {
    const status = response.statusCode ?? 0;
    console.log(`AUTH_STATUS=${status}`);
    if (status !== 200) process.exitCode = 1;
  });
});
request.on("error", () => {
  console.log("AUTH_STATUS=0");
  process.exitCode = 1;
});
request.end();
NODE
}

wait_for_readiness() {
  local max_attempts="${1:-20}"
  local poll_seconds="${2:-0.5}"
  local attempt
  case "$max_attempts" in
    ''|*[!0-9]*) printf 'invalid readiness attempt bound\n' >&2; return 2 ;;
  esac
  test "$max_attempts" -gt 0 || { printf 'invalid readiness attempt bound\n' >&2; return 2; }
  for ((attempt=1; attempt<=max_attempts; attempt++)); do
    if systemctl is-active --quiet uiadapt-static.service &&
      systemctl is-active --quiet uiadapt-gateway.service &&
      curl --connect-timeout 1 --max-time 2 \
        --fail --silent \
        http://127.0.0.1:5173/uiadapt_demo/ \
        --output /dev/null &&
      test "$(curl --connect-timeout 1 --max-time 2 \
        --silent --output /dev/null --write-out '%{http_code}' \
        http://127.0.0.1:4180/uiadapt_demo/)" = "401"; then
      return 0
    fi
    if test "$attempt" -lt "$max_attempts"; then
      sleep "$poll_seconds"
    fi
  done
  printf 'services did not become ready after %s attempts\n' "$max_attempts" >&2
  return 1
}

test "$(stat -c %d "$DEPLOY_ROOT")" = "$(stat -c %d "$CURRENT_TARGET")"
test ! -e "$DEPLOY_ROOT/current.rollback.new"
test ! -L "$DEPLOY_ROOT/current.rollback.new"
test ! -e "$DEPLOY_ROOT/current.manual-recover.new"
test ! -L "$DEPLOY_ROOT/current.manual-recover.new"

manual_recover() {
  local failure_status=$?
  trap - ERR
  set +e
  printf 'manual rollback failed; restoring original release\n' >&2
  if test -e "$DEPLOY_ROOT/current.manual-recover.new" || test -L "$DEPLOY_ROOT/current.manual-recover.new"; then
    printf 'manual recovery staging path unexpectedly exists\n' >&2
    exit "$failure_status"
  fi
  ln -s "$CURRENT_TARGET" "$DEPLOY_ROOT/current.manual-recover.new" || exit "$failure_status"
  test "$(readlink -f "$DEPLOY_ROOT/current.manual-recover.new")" = "$CURRENT_TARGET" || exit "$failure_status"
  mv -T "$DEPLOY_ROOT/current.manual-recover.new" "$DEPLOY_ROOT/current" || exit "$failure_status"
  systemctl daemon-reload || exit "$failure_status"
  systemctl restart uiadapt-static.service uiadapt-gateway.service || exit "$failure_status"
  wait_for_readiness || exit "$failure_status"
  test "$(readlink -f "$DEPLOY_ROOT/current")" = "$CURRENT_TARGET" || exit "$failure_status"
  systemctl is-active --quiet uiadapt-static.service || exit "$failure_status"
  systemctl is-active --quiet uiadapt-gateway.service || exit "$failure_status"
  curl --connect-timeout 3 --max-time 10 \
    --fail --silent --show-error \
    http://127.0.0.1:5173/uiadapt_demo/ \
    --output /dev/null || exit "$failure_status"
  test "$(curl --connect-timeout 3 --max-time 10 \
    --silent --output /dev/null --write-out '%{http_code}' \
    http://127.0.0.1:4180/uiadapt_demo/)" = "401" || exit "$failure_status"
  manual_auth_smoke "http://127.0.0.1:4180/uiadapt_demo/" || exit "$failure_status"
  manual_auth_smoke "$PUBLIC_URL" || exit "$failure_status"
  exit "$failure_status"
}

trap 'manual_recover' ERR
ln -s "releases/$ROLLBACK_SHA" "$DEPLOY_ROOT/current.rollback.new"
test "$(readlink -f "$DEPLOY_ROOT/current.rollback.new")" = "$ROLLBACK_TARGET"
mv -T "$DEPLOY_ROOT/current.rollback.new" "$DEPLOY_ROOT/current"
systemctl daemon-reload
systemctl restart uiadapt-static.service uiadapt-gateway.service
wait_for_readiness
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$ROLLBACK_TARGET"
systemctl is-active --quiet uiadapt-static.service
systemctl is-active --quiet uiadapt-gateway.service
curl --connect-timeout 3 --max-time 10 \
  --fail --silent --show-error \
  http://127.0.0.1:5173/uiadapt_demo/ \
  --output /dev/null
test "$(curl --connect-timeout 3 --max-time 10 \
  --silent --output /dev/null --write-out '%{http_code}' \
  http://127.0.0.1:4180/uiadapt_demo/)" = "401"
manual_auth_smoke "http://127.0.0.1:4180/uiadapt_demo/"
manual_auth_smoke "$PUBLIC_URL"
trap - ERR
printf 'MANUAL_ROLLBACK_STATUS=PASS\n'
```

수동 rollback block도 자체 secret-safe Node helper로 local/public authenticated smoke를 실행합니다. 모든 curl과 Node 요청은 제한시간을 넘기면 nonzero로 실패합니다. `tailscale funnel` 재설정 명령은 두 recipe에 포함하지 않으며 기존 8443 설정은 변경 금지, 기존 8787 설정도 변경 금지입니다.

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

readiness, authentication 또는 public smoke가 하나라도 실패하면 `success`를 선언하지 않습니다. 위 fail-closed 명령으로 `current`를 캡처한 `PREVIOUS_TARGET`으로 되돌리고 static과 gateway를 재시작한 뒤 동일 검증을 반복합니다. 최초 배포라 이전 release가 없으면 새 unit과 Funnel :443만 중지하며, 실패 release와 로그는 감사 증거로 보존합니다.

## 7. 측정된 상태와 현재 작업 경계

2026-08-21 R3 증거에서 nwg `current`는 `fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91`을 가리켰고 두 서비스, 로컬/공개 인증, Funnel 경로가 통과했습니다. 이는 해당 시각의 측정값이며 현재 상태를 영구 보증하지 않습니다.

이 문서가 포함된 R8 remediation은 live server에 배포하지 않았습니다: `R8_NOT_DEPLOYED`. 원격 runtime을 다시 측정하기 전에는 R8 배포 성공을 주장하지 않습니다.

## 8. 잔존 한계

- Tailscale Funnel은 beta이고 비구성형 bandwidth limit가 있는 외부 운영 의존성입니다.
- full host reboot는 수행하지 않았습니다. enable 상태와 개별 service restart만 검증했습니다.
- application-layer rate limiter와 전용 service user는 없습니다.
- 3인 제품 명확성 시험은 `PRODUCT_CLARITY = NOT_VERIFIED`입니다.
- main merge와 자동 배포는 이 운영 계약의 범위 밖입니다.
