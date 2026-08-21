$ErrorActionPreference = 'Stop'

$remoteScript = @'
set -euo pipefail
root=/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo
printf 'HISTORY_CAPTURE_UTC=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf 'CURRENT=%s\n' "$(readlink -f "$root/current")"
printf 'RELEASES_BEGIN\n'
find "$root/releases" -mindepth 1 -maxdepth 1 -printf '%f\n' | sort
printf 'RELEASES_END\n'
printf 'JOURNAL_BEGIN\n'
sudo journalctl \
  -u uiadapt-static.service \
  -u uiadapt-gateway.service \
  --since '2026-08-21 01:45:35 UTC' \
  --until '2026-08-21 01:47:05 UTC' \
  --no-pager \
  -o short-iso
printf 'JOURNAL_END\n'
printf 'STATIC_NRESTARTS=%s\n' "$(systemctl show -p NRestarts --value uiadapt-static.service)"
printf 'GATEWAY_NRESTARTS=%s\n' "$(systemctl show -p NRestarts --value uiadapt-gateway.service)"
'@

& 'C:/Users/Administrator/.codex/skills/powershell-ssh-safe-quoting/scripts/Invoke-SafeSshScript.ps1' -HostName 'nwg' -ScriptText $remoteScript
