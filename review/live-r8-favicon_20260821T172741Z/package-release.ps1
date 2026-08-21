param(
  [Parameter(Mandatory = $true)] [string]$Worktree,
  [Parameter(Mandatory = $true)] [string]$EvidenceRoot
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$expectedHead = "e076d9f90af1cd897842383780053595c8654170"
$summary = Get-Content -LiteralPath (Join-Path $EvidenceRoot "source-gate-summary.json") -Raw | ConvertFrom-Json
if ($summary.status -ne "SOURCE_GATE_PASS" -or $summary.commands_executed -ne 10) { throw "source gate not complete" }
if (@($summary.receipts | Where-Object { $_.exit_code -ne 0 }).Count -ne 0) { throw "source gate contains failures" }
if ((& git -C $Worktree rev-parse HEAD).Trim() -ne $expectedHead) { throw "source SHA mismatch" }
if (@(& git -C $Worktree status --short --untracked-files=no).Count -ne 0) { throw "tracked source drift" }

$generatedRoot = Join-Path $Worktree "www\uiadapt_demo"
if (-not (Test-Path -LiteralPath (Join-Path $generatedRoot "index.html") -PathType Leaf)) { throw "fresh nwg payload missing" }

$artifactsRoot = Join-Path $EvidenceRoot "artifacts"
$archivePath = Join-Path $artifactsRoot "uiadapt-r8-favicon-$expectedHead.tar.gz"
$receiptPath = Join-Path $artifactsRoot "release-package-receipt.json"
$externalManifestPath = Join-Path $artifactsRoot "PACKAGE-CONTENTS.json"
$externalSumsPath = Join-Path $artifactsRoot "SHA256SUMS"
foreach ($path in @($archivePath, $receiptPath, $externalManifestPath, $externalSumsPath)) {
  if (Test-Path -LiteralPath $path) { throw "refusing to overwrite artifact: $path" }
}

$temporaryRoot = Join-Path (Split-Path -Parent $EvidenceRoot) ".package-$expectedHead-20260821T172741Z"
if (Test-Path -LiteralPath $temporaryRoot) { throw "refusing to reuse package temporary root" }
$stageRoot = Join-Path $temporaryRoot "stage"
$verifyRoot = Join-Path $temporaryRoot "verify"
$sourceTar = Join-Path $temporaryRoot "source.tar"
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

try {
  & git -C $Worktree archive --format=tar --output=$sourceTar HEAD
  if ($LASTEXITCODE -ne 0) { throw "git archive failed" }
  & tar -xf $sourceTar -C $stageRoot
  if ($LASTEXITCODE -ne 0) { throw "git archive extraction failed" }

  foreach ($excluded in @(".git", "node_modules", "review", "test-results", "playwright-report")) {
    $candidate = Join-Path $stageRoot $excluded
    if (Test-Path -LiteralPath $candidate) {
      $resolvedCandidate = [IO.Path]::GetFullPath($candidate)
      $stagePrefix = [IO.Path]::GetFullPath($stageRoot).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
      if (-not $resolvedCandidate.StartsWith($stagePrefix, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe exclusion target" }
      Remove-Item -LiteralPath $resolvedCandidate -Recurse -Force
    }
  }

  $stageWww = Join-Path $stageRoot "www"
  New-Item -ItemType Directory -Path $stageWww -Force | Out-Null
  $stageGenerated = Join-Path $stageWww "uiadapt_demo"
  if (Test-Path -LiteralPath $stageGenerated) { throw "tracked archive contains generated payload path" }
  Copy-Item -LiteralPath $generatedRoot -Destination $stageGenerated -Recurse

  $payloadFiles = Get-ChildItem -LiteralPath $stageRoot -Recurse -File | Sort-Object FullName
  $entries = foreach ($file in $payloadFiles) {
    [ordered]@{
      path = [IO.Path]::GetRelativePath($stageRoot, $file.FullName).Replace("\", "/")
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
  $internalManifest = Join-Path $stageRoot "PACKAGE-CONTENTS.json"
  $internalSums = Join-Path $stageRoot "SHA256SUMS"
  $manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $internalManifest -Encoding utf8NoBOM
  (($entries | ForEach-Object { "$($_['sha256'])  $($_['path'])" }) -join "`n") + "`n" | Set-Content -LiteralPath $internalSums -Encoding utf8NoBOM -NoNewline
  Copy-Item -LiteralPath $internalManifest -Destination $externalManifestPath
  Copy-Item -LiteralPath $internalSums -Destination $externalSumsPath

  & tar -czf $archivePath -C $stageRoot .
  if ($LASTEXITCODE -ne 0) { throw "archive creation failed" }

  New-Item -ItemType Directory -Path $verifyRoot -Force | Out-Null
  & tar -xzf $archivePath -C $verifyRoot
  if ($LASTEXITCODE -ne 0) { throw "archive round-trip extraction failed" }
  $verifiedManifest = Get-Content -LiteralPath (Join-Path $verifyRoot "PACKAGE-CONTENTS.json") -Raw | ConvertFrom-Json
  if ($verifiedManifest.source_sha -ne $expectedHead) { throw "round-trip source SHA mismatch" }
  if ((Get-FileHash -LiteralPath (Join-Path $verifyRoot "PACKAGE-CONTENTS.json") -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $externalManifestPath -Algorithm SHA256).Hash) { throw "manifest copies differ" }
  foreach ($entry in $verifiedManifest.files) {
    $candidate = Join-Path $verifyRoot ($entry.path.Replace("/", "\"))
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { throw "missing round-trip file: $($entry.path)" }
    if ((Get-Item -LiteralPath $candidate).Length -ne $entry.bytes) { throw "round-trip size mismatch: $($entry.path)" }
    if ((Get-FileHash -LiteralPath $candidate -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw "round-trip hash mismatch: $($entry.path)" }
  }
  $excludedPresent = @(@(".git", "node_modules", "review", "test-results", "playwright-report") | Where-Object { Test-Path -LiteralPath (Join-Path $verifyRoot $_) })
  if ($excludedPresent.Count -ne 0) { throw "excluded paths present in package" }

  $receipt = [ordered]@{
    phase = "fresh-local-package"
    status = "PACKAGE_PASS"
    source_sha = $expectedHead
    archive_path = $archivePath
    archive_bytes = (Get-Item -LiteralPath $archivePath).Length
    archive_sha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    payload_file_count = [int]$verifiedManifest.payload_file_count
    payload_expanded_bytes = [long]$verifiedManifest.payload_expanded_bytes
    package_manifest_sha256 = (Get-FileHash -LiteralPath $externalManifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
    sha256sums_sha256 = (Get-FileHash -LiteralPath $externalSumsPath -Algorithm SHA256).Hash.ToLowerInvariant()
    archive_roundtrip_verification = "PASS"
    excluded_paths_present = @($excludedPresent)
    generated_utc = [DateTimeOffset]::UtcNow.ToString("o")
  }
  $receipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $receiptPath -Encoding utf8NoBOM
  $receipt | ConvertTo-Json -Depth 5
}
finally {
  if (Test-Path -LiteralPath $temporaryRoot) {
    $temporaryFull = [IO.Path]::GetFullPath($temporaryRoot)
    $expectedPrefix = [IO.Path]::GetFullPath((Split-Path -Parent $EvidenceRoot)).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $temporaryFull.StartsWith($expectedPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe package cleanup target" }
    Remove-Item -LiteralPath $temporaryFull -Recurse -Force
  }
}
