$ErrorActionPreference = "Stop"

$commands = @(
  "npm ci",
  "npm run lint",
  "npm test",
  "npm run test:gateway",
  "npm run verify:build-bases",
  "npm run build",
  "npm run test:e2e",
  "npm audit --omit=dev --audit-level=high",
  "git diff --check fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91..HEAD"
)

foreach ($command in $commands) {
  Write-Output "COMMAND_BEGIN=$command"
  & cmd.exe /d /s /c $command
  $exitCode = $LASTEXITCODE
  Write-Output "COMMAND_EXIT=$exitCode"
  if ($exitCode -ne 0) {
    exit $exitCode
  }
}

Write-Output "SOURCE_GATE=PASS"
