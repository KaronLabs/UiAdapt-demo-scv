set -Eeuo pipefail
set +x
DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
TARGET="e076d9f90af1cd897842383780053595c8654170"
PREVIOUS="fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91"
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
test -d "$DEPLOY_ROOT/releases/$PREVIOUS"
test -d "$DEPLOY_ROOT/releases/$TARGET"
test ! -e "$DEPLOY_ROOT/releases/$TARGET.staging"
test ! -e "$DEPLOY_ROOT/current.new"
test ! -L "$DEPLOY_ROOT/current.new"
test ! -e "$DEPLOY_ROOT/current.rollback.new"
test ! -L "$DEPLOY_ROOT/current.rollback.new"
systemctl is-active --quiet uiadapt-static.service
systemctl is-active --quiet uiadapt-gateway.service
test "$(systemctl is-enabled uiadapt-static.service)" = "enabled"
test "$(systemctl is-enabled uiadapt-gateway.service)" = "enabled"
test "$(sudo -n stat -c '%U:%G:%a' /etc/uiadapt-demo/password)" = "root:root:600"
test "$(sudo -n stat -c '%s' /etc/uiadapt-demo/password)" -gt 0
test "$(git -C /mnt/nvme-hot/ne/karon_api_lab status --porcelain=v1 --untracked-files=no | wc -l)" -eq 0
test "$(curl --connect-timeout 3 --max-time 10 --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:5173/uiadapt_demo/)" = "200"
test "$(curl --connect-timeout 3 --max-time 10 --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:4180/uiadapt_demo/)" = "401"
printf 'FINAL_CURRENT_SHA=%s\n' "$PREVIOUS"
printf 'FINAL_TARGET_RELEASE_PRESENT=PASS\n'
printf 'FINAL_TARGET_STAGING_ABSENT=PASS\n'
printf 'FINAL_STATIC_ACTIVE_ENABLED=PASS\n'
printf 'FINAL_GATEWAY_ACTIVE_ENABLED=PASS\n'
printf 'FINAL_CREDENTIAL_METADATA=PASS\n'
printf 'FINAL_PARENT_TRACKED_DIRTY_COUNT=0\n'
printf 'FINAL_LOCAL_STATIC=200\n'
printf 'FINAL_LOCAL_GATEWAY_UNAUTH=401\n'
printf 'FINAL_INSTALLED_STATIC_UNIT_SHA256=%s\n' "$(sudo -n sha256sum /etc/systemd/system/uiadapt-static.service | cut -d' ' -f1)"
printf 'FINAL_INSTALLED_GATEWAY_UNIT_SHA256=%s\n' "$(sudo -n sha256sum /etc/systemd/system/uiadapt-gateway.service | cut -d' ' -f1)"
printf '%s\n' 'FINAL_FUNNEL_JSON_BEGIN'
tailscale funnel status --json
printf '%s\n' 'FINAL_FUNNEL_JSON_END'
printf '%s\n' 'SWITCH_WINDOW_JOURNAL_BEGIN'
sudo -n journalctl -u uiadapt-static.service -u uiadapt-gateway.service --since '2026-08-21 17:36:20 UTC' --no-pager -o short-iso
printf '%s\n' 'SWITCH_WINDOW_JOURNAL_END'