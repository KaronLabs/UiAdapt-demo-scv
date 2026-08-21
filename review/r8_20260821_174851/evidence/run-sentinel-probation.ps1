$ErrorActionPreference = "Stop"

$sentinel = Join-Path $PWD "www\uiadapt_demo\sentinel.txt"
$createdDirectory = $false
if (-not (Test-Path -LiteralPath (Split-Path -Parent $sentinel))) {
  New-Item -ItemType Directory -Path (Split-Path -Parent $sentinel) -Force | Out-Null
  $createdDirectory = $true
}
if (Test-Path -LiteralPath $sentinel) {
  throw "Refusing to overwrite existing sentinel: $sentinel"
}

try {
  [System.IO.File]::WriteAllText($sentinel, "DO-NOT-DELETE", [System.Text.UTF8Encoding]::new($false))
  $before = (Get-FileHash -Algorithm SHA256 -LiteralPath $sentinel).Hash.ToLower()
  Write-Output "SENTINEL_BEFORE=$before"
  & npm.cmd run test:deployment
  $testExit = $LASTEXITCODE
  Write-Output "DEPLOYMENT_TEST_EXIT=$testExit"
  if ($testExit -ne 0) { exit $testExit }
  if (-not (Test-Path -LiteralPath $sentinel)) {
    throw "Sentinel was deleted"
  }
  $after = (Get-FileHash -Algorithm SHA256 -LiteralPath $sentinel).Hash.ToLower()
  Write-Output "SENTINEL_AFTER=$after"
  if ($before -ne $after) {
    throw "Sentinel hash changed"
  }
  Write-Output "SENTINEL_PRESERVED=PASS"
} finally {
  if (Test-Path -LiteralPath $sentinel) {
    Remove-Item -LiteralPath $sentinel -Force
  }
  if ($createdDirectory) {
    $releaseRoot = Split-Path -Parent $sentinel
    $wwwRoot = Split-Path -Parent $releaseRoot
    if ((Get-ChildItem -LiteralPath $releaseRoot -Force | Measure-Object).Count -eq 0) {
      Remove-Item -LiteralPath $releaseRoot
    }
    if ((Get-ChildItem -LiteralPath $wwwRoot -Force | Measure-Object).Count -eq 0) {
      Remove-Item -LiteralPath $wwwRoot
    }
  }
}
