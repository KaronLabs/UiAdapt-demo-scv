set -Eeuo pipefail
set +x
DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
TARGET="e076d9f90af1cd897842383780053595c8654170"
PREVIOUS="fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91"
INCOMING="$DEPLOY_ROOT/releases/.$TARGET.incoming.tar.gz"
STAGING="$DEPLOY_ROOT/releases/$TARGET.staging"
FINAL="$DEPLOY_ROOT/releases/$TARGET"
EXPECTED_ARCHIVE_SHA="fdf228fb1af1ddf92ef92a3a20f2286245cc02206f9a60234346de41be911055"

test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
test -f "$INCOMING"
test ! -e "$STAGING"
test ! -L "$STAGING"
test ! -e "$FINAL"
test ! -L "$FINAL"
ACTUAL_ARCHIVE_SHA="$(sha256sum "$INCOMING" | cut -d' ' -f1)"
test "$ACTUAL_ARCHIVE_SHA" = "$EXPECTED_ARCHIVE_SHA"
mkdir "$STAGING"
tar -xzf "$INCOMING" -C "$STAGING"
cd "$STAGING"
node <<'NODE'
const { readFileSync, existsSync, statSync } = require("node:fs");
const { createHash } = require("node:crypto");
const { resolve, sep } = require("node:path");
const target = "e076d9f90af1cd897842383780053595c8654170";
const root = process.cwd();
const manifest = JSON.parse(readFileSync("PACKAGE-CONTENTS.json", "utf8"));
if (manifest.source_sha !== target) throw new Error("source SHA mismatch");
for (const entry of manifest.files) {
  if (typeof entry.path !== "string" || entry.path.startsWith("/") || entry.path.includes("..")) {
    throw new Error("unsafe manifest path");
  }
  const candidate = resolve(root, entry.path);
  if (!candidate.startsWith(root + sep) || !existsSync(candidate) || !statSync(candidate).isFile()) {
    throw new Error("missing or unsafe payload file");
  }
  const body = readFileSync(candidate);
  if (body.length !== entry.bytes) throw new Error("size mismatch");
  const digest = createHash("sha256").update(body).digest("hex");
  if (digest !== entry.sha256) throw new Error("hash mismatch");
}
console.log("REMOTE_MANIFEST_FILES=" + manifest.files.length);
console.log("REMOTE_MANIFEST_VERIFY=PASS");
NODE
npm ci
npm ls
sudo -n cmp --silent deploy/systemd/uiadapt-static.service /etc/systemd/system/uiadapt-static.service
sudo -n cmp --silent deploy/systemd/uiadapt-gateway.service /etc/systemd/system/uiadapt-gateway.service
sudo -n systemd-analyze verify deploy/systemd/uiadapt-static.service deploy/systemd/uiadapt-gateway.service
test "$(readlink -f "$DEPLOY_ROOT/current")" = "$DEPLOY_ROOT/releases/$PREVIOUS"
printf 'REMOTE_ARCHIVE_SHA=%s\n' "$ACTUAL_ARCHIVE_SHA"
printf 'REMOTE_STAGING_PREP=PASS\n'
printf 'CURRENT_UNCHANGED=%s\n' "$PREVIOUS"