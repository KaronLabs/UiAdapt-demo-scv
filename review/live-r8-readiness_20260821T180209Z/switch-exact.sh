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
  local deadline_seconds="${3:-30}"
  case "$max_attempts" in
    ''|*[!0-9]*) printf 'invalid readiness attempt bound\n' >&2; return 2 ;;
  esac
  test "$max_attempts" -gt 0 || { printf 'invalid readiness attempt bound\n' >&2; return 2; }
  case "$deadline_seconds" in
    ''|*[!0-9]*) printf 'invalid readiness deadline\n' >&2; return 2 ;;
  esac
  test "$deadline_seconds" -gt 0 || { printf 'invalid readiness deadline\n' >&2; return 2; }
  timeout --signal=TERM --kill-after=1s "${deadline_seconds}s" \
    bash -s -- "$max_attempts" "$poll_seconds" <<'READINESS'
set -Eeuo pipefail
max_attempts="$1"
poll_seconds="$2"
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
      exit 0
    fi
    if test "$attempt" -lt "$max_attempts"; then
      sleep "$poll_seconds"
    fi
  done
  printf 'services did not become ready after %s attempts\n' "$max_attempts" >&2
  exit 1
READINESS
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
  test "$(curl --connect-timeout 3 --max-time 10 \
    --silent --output /dev/null --write-out '%{http_code}' \
    http://127.0.0.1:4180/uiadapt_demo/)" = "401" || exit "$failure_status"
  auth_smoke "http://127.0.0.1:4180/uiadapt_demo/" || exit "$failure_status"
  auth_smoke "$PUBLIC_URL" || exit "$failure_status"
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
