set -Eeuo pipefail
set +x
DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
TARGET="e076d9f90af1cd897842383780053595c8654170"
PREVIOUS="fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91"
STAGING="$DEPLOY_ROOT/releases/$TARGET.staging"
FINAL="$DEPLOY_ROOT/releases/$TARGET"
RUNNER="/tmp/uiadapt-r8-favicon-runner-$TARGET"
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
test -d "$STAGING"
test ! -e "$FINAL"
test ! -L "$FINAL"
test ! -e "$RUNNER"
mkdir -p "$RUNNER/node_modules"
cp -a "$STAGING/node_modules/playwright" "$RUNNER/node_modules/"
cp -a "$STAGING/node_modules/playwright-core" "$RUNNER/node_modules/"
test -f "$RUNNER/node_modules/playwright/package.json"
cd "$STAGING"
npm prune --omit=dev
npm ls --omit=dev
npm audit --omit=dev --audit-level=high
test ! -d node_modules/playwright
test -x node_modules/.bin/serve
test -d node_modules/react
test -d node_modules/react-dom
sudo -n cmp --silent deploy/systemd/uiadapt-static.service /etc/systemd/system/uiadapt-static.service
sudo -n cmp --silent deploy/systemd/uiadapt-gateway.service /etc/systemd/system/uiadapt-gateway.service
sudo -n systemd-analyze verify deploy/systemd/uiadapt-static.service deploy/systemd/uiadapt-gateway.service
mv "$STAGING" "$FINAL"
test -d "$FINAL"
test ! -e "$STAGING"
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
printf 'PRODUCTION_PRUNE=PASS\n'
printf 'EXTERNAL_BROWSER_RUNNER=READY\n'
printf 'FINAL_RELEASE_READY=%s\n' "$TARGET"
printf 'CURRENT_UNCHANGED=%s\n' "$PREVIOUS"