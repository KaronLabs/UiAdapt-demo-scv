$ErrorActionPreference = 'Stop'

$remoteScript = @'
set -euo pipefail
root=/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo
expected_sha=fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91
expected_release=$root/releases/$expected_sha
public_host=00-new-world-gpu.tail645adc.ts.net
netrc_file=$(mktemp /tmp/uiadapt-court-netrc.XXXXXX)
headers_file=$(mktemp /tmp/uiadapt-court-headers.XXXXXX)
cleanup() {
  rm -f -- "$netrc_file" "$headers_file"
}
trap cleanup EXIT
umask 077
credential=$(sudo cat /etc/uiadapt-demo/password)
printf 'machine 127.0.0.1 login reviewer password %s\n' "$credential" > "$netrc_file"
printf 'machine %s login reviewer password %s\n' "$public_host" "$credential" >> "$netrc_file"
unset credential

current=$(readlink -f "$root/current")
static_state=$(systemctl is-active uiadapt-static.service)
gateway_state=$(systemctl is-active uiadapt-gateway.service)
static_enabled=$(systemctl is-enabled uiadapt-static.service)
gateway_enabled=$(systemctl is-enabled uiadapt-gateway.service)
local_unauth=$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:4180/uiadapt_demo/)
local_auth=$(curl -sS --netrc-file "$netrc_file" -o /dev/null -w '%{http_code}' http://127.0.0.1:4180/uiadapt_demo/)
public_unauth=$(curl -sS -o /dev/null -w '%{http_code}' https://$public_host/uiadapt_demo/)
public_auth=$(curl -sS --netrc-file "$netrc_file" -o /dev/null -w '%{http_code}' https://$public_host/uiadapt_demo/)
public_root=$(curl -sS --netrc-file "$netrc_file" -D "$headers_file" -o /dev/null -w '%{http_code}' https://$public_host/)
public_location=$(awk 'BEGIN{IGNORECASE=1} /^Location:/{gsub(/\r/,""); print $2}' "$headers_file" | tail -n 1)
funnel_status=$(tailscale funnel status)
parent_dirty=$(git -C /mnt/nvme-hot/ne/karon_api_lab status --porcelain | wc -l)

[ "$current" = "$expected_release" ]
[ "$static_state" = active ]
[ "$gateway_state" = active ]
[ "$static_enabled" = enabled ]
[ "$gateway_enabled" = enabled ]
[ "$local_unauth" = 401 ]
[ "$local_auth" = 200 ]
[ "$public_unauth" = 401 ]
[ "$public_auth" = 200 ]
[ "$public_root" = 302 ]
[ "$public_location" = /uiadapt_demo/ ]
[ "$parent_dirty" -eq 0 ]
printf '%s\n' "$funnel_status" | grep -q 'proxy http://127.0.0.1:4180'
printf '%s\n' "$funnel_status" | grep -q ':8443 (tailnet only)'
printf '%s\n' "$funnel_status" | grep -q 'proxy http://127.0.0.1:8101'
printf '%s\n' "$funnel_status" | grep -q ':8787'
printf '%s\n' "$funnel_status" | grep -q 'proxy http://127.0.0.1:8787'

printf 'RUNTIME_UTC=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf 'CURRENT=%s\n' "$current"
printf 'STATIC=%s/%s\n' "$static_enabled" "$static_state"
printf 'GATEWAY=%s/%s\n' "$gateway_enabled" "$gateway_state"
printf 'LOCAL_UNAUTH=%s\n' "$local_unauth"
printf 'LOCAL_AUTH=%s\n' "$local_auth"
printf 'PUBLIC_UNAUTH=%s\n' "$public_unauth"
printf 'PUBLIC_AUTH=%s\n' "$public_auth"
printf 'PUBLIC_ROOT=%s\n' "$public_root"
printf 'PUBLIC_LOCATION=%s\n' "$public_location"
printf 'PARENT_DIRTY_COUNT=%s\n' "$parent_dirty"
printf 'CREDENTIAL_META=%s\n' "$(sudo stat -c '%a:%U:%G:%s' /etc/uiadapt-demo/password)"
printf '%s\n' "$funnel_status"
printf 'RUNTIME_GATE=PASS\n'
'@

& 'C:/Users/Administrator/.codex/skills/powershell-ssh-safe-quoting/scripts/Invoke-SafeSshScript.ps1' -HostName 'nwg' -ScriptText $remoteScript
