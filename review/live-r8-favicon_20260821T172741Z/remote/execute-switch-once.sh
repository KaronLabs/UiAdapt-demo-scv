set -Eeuo pipefail
set +x
TARGET="e076d9f90af1cd897842383780053595c8654170"
SWITCH_FILE="/tmp/uiadapt-r8-favicon-switch-$TARGET.sh"
test "$(sha256sum "$SWITCH_FILE" | cut -d' ' -f1)" = "1e0b95167bb9fc475881bf4cec04222156517d1da4ac4fbf59caeb5e2d51635f"
sudo -n env NEW_SHA="$TARGET" bash "$SWITCH_FILE"