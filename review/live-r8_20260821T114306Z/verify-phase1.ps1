param(
  [Parameter(Mandatory = $true)] [string]$Worktree,
  [Parameter(Mandatory = $true)] [string]$EvidenceRoot
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$expectedHead = "00c4c47a63f859d33b4264f6e6ddb3c5ef71913b"
$artifactsRoot = Join-Path $EvidenceRoot "artifacts"
$archivePath = Join-Path $artifactsRoot "uiadapt-r8-$expectedHead.tar.gz"
$archiveReceiptPath = Join-Path $artifactsRoot "uiadapt-r8-$expectedHead.archive-receipt.json"
$externalManifestPath = Join-Path $artifactsRoot "uiadapt-r8-$expectedHead.PACKAGE-CONTENTS.json"
$rawRoot = Join-Path $EvidenceRoot "raw"
$verificationPath = Join-Path $EvidenceRoot "phase1-final-verification.json"
if (Test-Path -LiteralPath $verificationPath) { throw "refusing to overwrite phase verification" }

$started = [DateTimeOffset]::UtcNow
$archiveReceipt = Get-Content -LiteralPath $archiveReceiptPath -Raw | ConvertFrom-Json
$archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($archiveHash -ne $archiveReceipt.archive_sha256) { throw "archive hash mismatch" }

$commandReceipts = Get-ChildItem -LiteralPath $rawRoot -Filter "phase1-*.receipt.json" | Sort-Object Name
if ($commandReceipts.Count -ne 10) { throw "expected ten source-gate receipts" }
$commandResults = foreach ($file in $commandReceipts) {
  $receipt = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json
  if ($receipt.exit_code -ne 0) { throw "nonzero source-gate receipt: $($file.Name)" }
  [ordered]@{ receipt = $file.Name; command = $receipt.command; exit_code = $receipt.exit_code }
}

$temporaryRoot = Join-Path (Split-Path -Parent $EvidenceRoot) ".phase1-verify-$expectedHead"
if (Test-Path -LiteralPath $temporaryRoot) { throw "refusing to reuse verification directory" }
New-Item -ItemType Directory -Path $temporaryRoot | Out-Null

try {
  & tar -xzf $archivePath -C $temporaryRoot
  if ($LASTEXITCODE -ne 0) { throw "archive extraction failed" }

  $internalManifestPath = Join-Path $temporaryRoot "PACKAGE-CONTENTS.json"
  $internalManifestHash = (Get-FileHash -LiteralPath $internalManifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
  $externalManifestHash = (Get-FileHash -LiteralPath $externalManifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($internalManifestHash -ne $externalManifestHash) { throw "internal and external manifest differ" }
  $manifest = Get-Content -LiteralPath $internalManifestPath -Raw | ConvertFrom-Json
  if ($manifest.source_sha -ne $expectedHead) { throw "manifest SHA mismatch" }

  $verifiedBytes = [long]0
  foreach ($entry in $manifest.files) {
    $filePath = Join-Path $temporaryRoot ($entry.path.Replace("/", "\"))
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) { throw "missing file $($entry.path)" }
    if ((Get-Item -LiteralPath $filePath).Length -ne $entry.bytes) { throw "size mismatch $($entry.path)" }
    if ((Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw "hash mismatch $($entry.path)" }
    $verifiedBytes += [long]$entry.bytes
  }
  if ($manifest.files.Count -ne $manifest.payload_file_count) { throw "manifest count mismatch" }
  if ($verifiedBytes -ne $manifest.payload_expanded_bytes) { throw "manifest byte total mismatch" }

  $excludedPresent = @(".git", "node_modules", "review", "test-results", "playwright-report") | Where-Object {
    Test-Path -LiteralPath (Join-Path $temporaryRoot $_)
  }
  if (@($excludedPresent).Count -ne 0) { throw "excluded paths found" }

  $head = (& git -C $Worktree rev-parse HEAD).Trim()
  if ($head -ne $expectedHead) { throw "worktree head drift" }
  $trackedDiff = & git -C $Worktree status --short --untracked-files=no
  if ($LASTEXITCODE -ne 0 -or @($trackedDiff).Count -ne 0) { throw "tracked worktree changed" }

  $stderrFiles = Get-ChildItem -LiteralPath $rawRoot -Filter "phase1-*.stderr.log" | Sort-Object Name
  $stderrInventory = foreach ($file in $stderrFiles) {
    [ordered]@{ file = $file.Name; bytes = $file.Length }
  }

  $ended = [DateTimeOffset]::UtcNow
  $result = [ordered]@{
    phase = "phase1-final-verification"
    status = "PHASE1_GO"
    start_utc = $started.ToString("o")
    end_utc = $ended.ToString("o")
    source_sha = $head
    tracked_source_changes = 0
    command_receipts = $commandResults
    command_receipt_count = $commandReceipts.Count
    archive_path = $archivePath
    archive_bytes = (Get-Item -LiteralPath $archivePath).Length
    archive_sha256 = $archiveHash
    internal_external_manifest_match = $true
    payload_file_count = [int]$manifest.payload_file_count
    payload_expanded_bytes = [long]$manifest.payload_expanded_bytes
    payload_hash_verification = "PASS"
    excluded_paths_present = @($excludedPresent)
    stderr_inventory = @($stderrInventory)
    first_packaging_attempt_preserved = (Test-Path -LiteralPath (Join-Path $rawRoot "phase1-packaging-attempt-01.failure.json"))
    remote_mutation = $false
  }
  $result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $verificationPath -Encoding utf8NoBOM
  $result | ConvertTo-Json -Depth 8
}
finally {
  if (Test-Path -LiteralPath $temporaryRoot) {
    Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
  }
}
