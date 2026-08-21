set -Eeuo pipefail
set +x

DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
TARGET="e076d9f90af1cd897842383780053595c8654170"
PREVIOUS="fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91"
CREDENTIAL_FILE="/etc/uiadapt-demo/password"
PARENT_REPO="/mnt/nvme-hot/ne/karon_api_lab"

test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
test ! -e "$DEPLOY_ROOT/releases/$TARGET"
test ! -L "$DEPLOY_ROOT/releases/$TARGET"
test ! -e "$DEPLOY_ROOT/releases/$TARGET.staging"
test ! -L "$DEPLOY_ROOT/releases/$TARGET.staging"
test ! -e "$DEPLOY_ROOT/current.new"
test ! -L "$DEPLOY_ROOT/current.new"
test ! -e "$DEPLOY_ROOT/current.rollback.new"
test ! -L "$DEPLOY_ROOT/current.rollback.new"
systemctl is-active --quiet uiadapt-static.service
systemctl is-active --quiet uiadapt-gateway.service
test "$(systemctl is-enabled uiadapt-static.service)" = "enabled"
test "$(systemctl is-enabled uiadapt-gateway.service)" = "enabled"
test "$(sudo -n stat -c '%U:%G:%a' "$CREDENTIAL_FILE")" = "root:root:600"
test "$(sudo -n stat -c '%s' "$CREDENTIAL_FILE")" -gt 0
test "$(git -C "$PARENT_REPO" status --porcelain=v1 --untracked-files=no | wc -l)" -eq 0
sudo -n true
test -x /usr/bin/google-chrome
test "$(node --version | cut -d. -f1)" = "v24"

CURRENT_BYTES="$(du -sb "$DEPLOY_ROOT/releases/$PREVIOUS" | cut -f1)"
AVAILABLE_BYTES="$(df -B1 --output=avail "$DEPLOY_ROOT" | tail -n1 | tr -d ' ')"
INCOMING_EXPANDED_BYTES="14242575"
if test "$CURRENT_BYTES" -ge "$INCOMING_EXPANDED_BYTES"; then
  REQUIRED_BYTES="$((CURRENT_BYTES * 2))"
else
  REQUIRED_BYTES="$((INCOMING_EXPANDED_BYTES * 2))"
fi
test "$AVAILABLE_BYTES" -ge "$REQUIRED_BYTES"

printf 'REMOTE_PREFLIGHT=PASS\n'
printf 'CURRENT_SHA=%s\n' "$PREVIOUS"
printf 'TARGET_RELEASE_ABSENT=PASS\n'
printf 'TARGET_STAGING_ABSENT=PASS\n'
printf 'STATIC_ACTIVE_ENABLED=PASS\n'
printf 'GATEWAY_ACTIVE_ENABLED=PASS\n'
printf 'CREDENTIAL_METADATA=PASS\n'
printf 'CREDENTIAL_NONEMPTY=PASS\n'
printf 'PARENT_TRACKED_DIRTY_COUNT=0\n'
printf 'CURRENT_RELEASE_BYTES=%s\n' "$CURRENT_BYTES"
printf 'AVAILABLE_BYTES=%s\n' "$AVAILABLE_BYTES"
printf 'REQUIRED_BYTES=%s\n' "$REQUIRED_BYTES"
printf 'NODE_VERSION=%s\n' "$(node --version)"
printf 'CHROME_VERSION=%s\n' "$(/usr/bin/google-chrome --version)"
printf 'INSTALLED_STATIC_UNIT_SHA256=%s\n' "$(sudo -n sha256sum /etc/systemd/system/uiadapt-static.service | cut -d' ' -f1)"
printf 'INSTALLED_GATEWAY_UNIT_SHA256=%s\n' "$(sudo -n sha256sum /etc/systemd/system/uiadapt-gateway.service | cut -d' ' -f1)"
printf '%s\n' 'FUNNEL_JSON_BEGIN'
tailscale funnel status --json
printf '%s\n' 'FUNNEL_JSON_END'
