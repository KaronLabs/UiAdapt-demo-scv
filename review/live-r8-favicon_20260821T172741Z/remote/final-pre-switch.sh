set -Eeuo pipefail
set +x
DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
TARGET="e076d9f90af1cd897842383780053595c8654170"
PREVIOUS="fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91"
SWITCH_FILE="/tmp/uiadapt-r8-favicon-switch-$TARGET.sh"
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
test -d "$DEPLOY_ROOT/releases/$TARGET"
test ! -e "$DEPLOY_ROOT/releases/$TARGET.staging"
test ! -e "$DEPLOY_ROOT/current.new"
test ! -L "$DEPLOY_ROOT/current.new"
test ! -e "$DEPLOY_ROOT/current.rollback.new"
test ! -L "$DEPLOY_ROOT/current.rollback.new"
test "$(sha256sum "$SWITCH_FILE" | cut -d' ' -f1)" = "1e0b95167bb9fc475881bf4cec04222156517d1da4ac4fbf59caeb5e2d51635f"
systemctl is-active --quiet uiadapt-static.service
systemctl is-active --quiet uiadapt-gateway.service
test "$(systemctl is-enabled uiadapt-static.service)" = "enabled"
test "$(systemctl is-enabled uiadapt-gateway.service)" = "enabled"
test "$(sudo -n stat -c '%U:%G:%a' /etc/uiadapt-demo/password)" = "root:root:600"
test "$(sudo -n stat -c '%s' /etc/uiadapt-demo/password)" -gt 0
test "$(git -C /mnt/nvme-hot/ne/karon_api_lab status --porcelain=v1 --untracked-files=no | wc -l)" -eq 0
printf 'FINAL_PRE_SWITCH=PASS\n'
printf 'CURRENT_SHA=%s\n' "$PREVIOUS"
printf 'TARGET_FINAL_PRESENT=PASS\n'
printf 'SWITCH_FILE_SHA256=%s\n' "1e0b95167bb9fc475881bf4cec04222156517d1da4ac4fbf59caeb5e2d51635f"