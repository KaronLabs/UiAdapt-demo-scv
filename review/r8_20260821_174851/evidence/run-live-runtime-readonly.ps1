$ErrorActionPreference = "Stop"

$remoteScript = @'
set -euo pipefail
printf 'captured_utc='
date -u +%Y-%m-%dT%H:%M:%SZ
printf 'current='
readlink -f /mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo/current
printf 'static_active='
systemctl is-active uiadapt-static.service
printf 'gateway_active='
systemctl is-active uiadapt-gateway.service
printf 'static_enabled='
systemctl is-enabled uiadapt-static.service
printf 'gateway_enabled='
systemctl is-enabled uiadapt-gateway.service
stat -c 'credential_mode=%a owner=%U group=%G size=%s' /etc/uiadapt-demo/password
'@

& 'C:/Users/Administrator/.codex/skills/powershell-ssh-safe-quoting/scripts/Invoke-SafeSshScript.ps1' -HostName 'nwg' -ScriptText $remoteScript
exit $LASTEXITCODE
