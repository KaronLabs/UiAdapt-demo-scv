param(
  [Parameter(Mandatory = $true)]
  [string]$Worktree,

  [Parameter(Mandatory = $true)]
  [string]$EvidenceRoot
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$expectedHead = "00c4c47a63f859d33b4264f6e6ddb3c5ef71913b"
$actualHead = (& git -C $Worktree rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $actualHead -ne $expectedHead) {
  throw "exact source SHA mismatch"
}

$sourceGate = Get-Content -LiteralPath (Join-Path $EvidenceRoot "phase1-source-gate-summary.json") -Raw | ConvertFrom-Json
if ($sourceGate.status -ne "PHASE1_GO" -or $sourceGate.commands_executed -ne 10) {
  throw "source gate is not complete"
}
foreach ($receipt in $sourceGate.receipts) {
  if ($receipt.exit_code -ne 0) {
    throw "source gate contains a nonzero command"
  }
}

$generatedRoot = Join-Path $Worktree "www\uiadapt_demo"
if (-not (Test-Path -LiteralPath (Join-Path $generatedRoot "index.html") -PathType Leaf)) {
  throw "generated nwg payload is missing"
}

$artifactsRoot = Join-Path $EvidenceRoot "artifacts"
New-Item -ItemType Directory -Path $artifactsRoot -Force | Out-Null

$archiveName = "uiadapt-r8-$expectedHead.tar.gz"
$archivePath = Join-Path $artifactsRoot $archiveName
$archiveReceiptPath = Join-Path $artifactsRoot "uiadapt-r8-$expectedHead.archive-receipt.json"
$externalManifestPath = Join-Path $artifactsRoot "uiadapt-r8-$expectedHead.PACKAGE-CONTENTS.json"
$externalSumsPath = Join-Path $artifactsRoot "uiadapt-r8-$expectedHead.SHA256SUMS"

foreach ($target in @($archivePath, $archiveReceiptPath, $externalManifestPath, $externalSumsPath)) {
  if (Test-Path -LiteralPath $target) {
    throw "refusing to overwrite existing artifact: $target"
  }
}

$temporaryBase = Join-Path (Split-Path -Parent $EvidenceRoot) ".phase1-package-$expectedHead"
if (Test-Path -LiteralPath $temporaryBase) {
  throw "refusing to reuse temporary package path"
}

$stageRoot = Join-Path $temporaryBase "stage"
$verifyRoot = Join-Path $temporaryBase "verify"
$sourceTar = Join-Path $temporaryBase "tracked-source.tar"
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

try {
  & git -C $Worktree archive --format=tar --output=$sourceTar HEAD
  if ($LASTEXITCODE -ne 0) { throw "git archive failed" }

  & tar -xf $sourceTar -C $stageRoot
  if ($LASTEXITCODE -ne 0) { throw "tracked source extraction failed" }

  foreach ($excluded in @(".git", "node_modules", "review", "test-results", "playwright-report")) {
    $candidate = Join-Path $stageRoot $excluded
    if (Test-Path -LiteralPath $candidate) {
      $resolvedCandidate = [IO.Path]::GetFullPath($candidate)
      $resolvedStage = [IO.Path]::GetFullPath($stageRoot).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
      if (-not $resolvedCandidate.StartsWith($resolvedStage, [StringComparison]::OrdinalIgnoreCase)) {
        throw "unsafe exclusion target"
      }
      Remove-Item -LiteralPath $resolvedCandidate -Recurse -Force
    }
  }

  $stageWww = Join-Path $stageRoot "www"
  New-Item -ItemType Directory -Path $stageWww -Force | Out-Null
  $stageGenerated = Join-Path $stageWww "uiadapt_demo"
  if (Test-Path -LiteralPath $stageGenerated) {
    throw "tracked archive unexpectedly contains generated nwg payload"
  }
  Copy-Item -LiteralPath $generatedRoot -Destination $stageGenerated -Recurse

  $manifestName = "PACKAGE-CONTENTS.json"
  $sumsName = "SHA256SUMS"
  $payloadFiles = Get-ChildItem -LiteralPath $stageRoot -Recurse -File | Where-Object {
    $_.Name -ne $manifestName -and $_.Name -ne $sumsName
  } | Sort-Object FullName

  $entries = foreach ($file in $payloadFiles) {
    $relative = [IO.Path]::GetRelativePath($stageRoot, $file.FullName).Replace("\", "/")
    [ordered]@{
      path = $relative
      bytes = $file.Length
      sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
  }
  $expandedBytes = ($entries | ForEach-Object { [long]$_["bytes"] } | Measure-Object -Sum).Sum
  $manifest = [ordered]@{
    schema = "uiadapt-release-package/v1"
    source_sha = $expectedHead
    generated_utc = [DateTimeOffset]::UtcNow.ToString("o")
    payload_file_count = @($entries).Count
    payload_expanded_bytes = [long]$expandedBytes
    generated_payload = "www/uiadapt_demo"
    excluded_paths = @(".git", "node_modules", "review", "test-results", "playwright-report")
    manifest_self_excluded = $true
    files = @($entries)
  }
  $manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $stageRoot $manifestName) -Encoding utf8NoBOM
  $sumLines = $entries | ForEach-Object { "$($_.sha256)  $($_.path)" }
  ($sumLines -join "`n") + "`n" | Set-Content -LiteralPath (Join-Path $stageRoot $sumsName) -Encoding utf8NoBOM -NoNewline

  Copy-Item -LiteralPath (Join-Path $stageRoot $manifestName) -Destination $externalManifestPath
  Copy-Item -LiteralPath (Join-Path $stageRoot $sumsName) -Destination $externalSumsPath

  & tar -czf $archivePath -C $stageRoot .
  if ($LASTEXITCODE -ne 0) { throw "package archive creation failed" }

  New-Item -ItemType Directory -Path $verifyRoot -Force | Out-Null
  & tar -xzf $archivePath -C $verifyRoot
  if ($LASTEXITCODE -ne 0) { throw "package archive verification extraction failed" }

  $verifiedManifest = Get-Content -LiteralPath (Join-Path $verifyRoot $manifestName) -Raw | ConvertFrom-Json
  if ($verifiedManifest.source_sha -ne $expectedHead) { throw "package manifest source SHA mismatch" }
  foreach ($entry in $verifiedManifest.files) {
    $candidate = Join-Path $verifyRoot ($entry.path.Replace("/", "\"))
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { throw "missing payload file: $($entry.path)" }
    $actualHash = (Get-FileHash -LiteralPath $candidate -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $entry.sha256) { throw "payload hash mismatch: $($entry.path)" }
    if ((Get-Item -LiteralPath $candidate).Length -ne $entry.bytes) { throw "payload size mismatch: $($entry.path)" }
  }

  foreach ($excluded in @(".git", "node_modules", "review", "test-results", "playwright-report")) {
    if (Test-Path -LiteralPath (Join-Path $verifyRoot $excluded)) {
      throw "excluded path present in package: $excluded"
    }
  }

  $receipt = [ordered]@{
    phase = "local-package"
    status = "PHASE1_GO"
    source_sha = $expectedHead
    source_worktree = $Worktree
    archive_path = $archivePath
    archive_bytes = (Get-Item -LiteralPath $archivePath).Length
    archive_sha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    payload_file_count = [int]$verifiedManifest.payload_file_count
    payload_expanded_bytes = [long]$verifiedManifest.payload_expanded_bytes
    package_manifest_path = $externalManifestPath
    package_manifest_sha256 = (Get-FileHash -LiteralPath $externalManifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
    sha256sums_path = $externalSumsPath
    sha256sums_sha256 = (Get-FileHash -LiteralPath $externalSumsPath -Algorithm SHA256).Hash.ToLowerInvariant()
    archive_roundtrip_verification = "PASS"
    generated_utc = [DateTimeOffset]::UtcNow.ToString("o")
  }
  $receipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $archiveReceiptPath -Encoding utf8NoBOM
  $receipt | ConvertTo-Json -Depth 5
}
finally {
  if (Test-Path -LiteralPath $temporaryBase) {
    $resolvedTemporary = [IO.Path]::GetFullPath($temporaryBase)
    $expectedParent = [IO.Path]::GetFullPath((Split-Path -Parent $EvidenceRoot)).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $resolvedTemporary.StartsWith($expectedParent, [StringComparison]::OrdinalIgnoreCase)) {
      throw "unsafe temporary cleanup target"
    }
    Remove-Item -LiteralPath $resolvedTemporary -Recurse -Force
  }
}
