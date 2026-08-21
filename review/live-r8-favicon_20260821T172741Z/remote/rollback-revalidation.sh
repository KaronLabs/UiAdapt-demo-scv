set -Eeuo pipefail
set +x
DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
TARGET="e076d9f90af1cd897842383780053595c8654170"
PREVIOUS="fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91"
CREDENTIAL_FILE="/etc/uiadapt-demo/password"
PUBLIC_ORIGIN="https://00-new-world-gpu.tail645adc.ts.net"
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
test -d "$DEPLOY_ROOT/releases/$PREVIOUS"
test -d "$DEPLOY_ROOT/releases/$TARGET"
test ! -e "$DEPLOY_ROOT/releases/$TARGET.staging"
systemctl is-active --quiet uiadapt-static.service
systemctl is-active --quiet uiadapt-gateway.service
test "$(systemctl is-enabled uiadapt-static.service)" = "enabled"
test "$(systemctl is-enabled uiadapt-gateway.service)" = "enabled"
STATIC_STATUS="$(curl --connect-timeout 3 --max-time 10 --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:5173/uiadapt_demo/)"
UNAUTH_STATUS="$(curl --connect-timeout 3 --max-time 10 --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:4180/uiadapt_demo/)"
WRONG_STATUS="$(curl --connect-timeout 3 --max-time 10 --silent --user reviewer:known-wrong-value --output /dev/null --write-out '%{http_code}' http://127.0.0.1:4180/uiadapt_demo/)"
test "$STATIC_STATUS" = "200"
test "$UNAUTH_STATUS" = "401"
test "$WRONG_STATUS" = "401"
UIADAPT_CREDENTIAL_FILE="$CREDENTIAL_FILE" UIADAPT_PUBLIC_ORIGIN="$PUBLIC_ORIGIN" sudo -n --preserve-env=UIADAPT_CREDENTIAL_FILE,UIADAPT_PUBLIC_ORIGIN /usr/bin/node <<'NODE'
const { readFileSync } = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const raw = readFileSync(process.env.UIADAPT_CREDENTIAL_FILE, "utf8");
const password = raw.endsWith("\r\n") ? raw.slice(0, -2) : raw.endsWith("\n") ? raw.slice(0, -1) : raw;
const authorization = "Basic " + Buffer.from("reviewer:" + password).toString("base64");
const request = url => new Promise((resolve, reject) => {
  const target = new URL(url);
  const transport = target.protocol === "https:" ? https : http;
  const req = transport.request(target, { headers: { authorization }, signal: AbortSignal.timeout(10000) }, res => {
    res.resume(); res.on("end", () => resolve(res.statusCode || 0));
  });
  req.on("error", reject); req.end();
});
(async () => {
  const localRoot = await request("http://127.0.0.1:4180/");
  const localNested = await request("http://127.0.0.1:4180/uiadapt_demo/");
  const publicNested = await request(process.env.UIADAPT_PUBLIC_ORIGIN + "/uiadapt_demo/");
  console.log("ROLLBACK_LOCAL_AUTH_ROOT=" + localRoot);
  console.log("ROLLBACK_LOCAL_AUTH_NESTED=" + localNested);
  console.log("ROLLBACK_PUBLIC_AUTH_NESTED=" + publicNested);
  process.exit(localRoot === 302 && localNested === 200 && publicNested === 200 ? 0 : 1);
})().catch(() => process.exit(1));
NODE
test "$(git -C /mnt/nvme-hot/ne/karon_api_lab status --porcelain=v1 --untracked-files=no | wc -l)" -eq 0
printf 'ROLLBACK_CURRENT_SHA=%s\n' "$PREVIOUS"
printf 'ROLLBACK_STATIC_STATUS=%s\n' "$STATIC_STATUS"
printf 'ROLLBACK_GATEWAY_UNAUTH=%s\n' "$UNAUTH_STATUS"
printf 'ROLLBACK_GATEWAY_WRONG=%s\n' "$WRONG_STATUS"
printf 'ROLLBACK_STATE=PASS\n'
printf '%s\n' 'FUNNEL_JSON_BEGIN'
tailscale funnel status --json
printf '%s\n' 'FUNNEL_JSON_END'