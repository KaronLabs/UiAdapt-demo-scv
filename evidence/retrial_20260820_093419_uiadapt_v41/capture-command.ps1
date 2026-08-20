param(
    [Parameter(Mandatory = $true)][string]$LogPath,
    [Parameter(Mandatory = $true)][string]$DisplayCommand,
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $false)][string[]]$ArgumentList = @(),
    [Parameter(Mandatory = $true)][string]$TargetSha
)

$ErrorActionPreference = "Stop"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$start = Get-Date -Format o
$workingDirectory = (Get-Location).Path
$temporaryOutput = "$LogPath.capture.tmp"

$header = @(
    "COMMAND: $DisplayCommand"
    "START_TIMESTAMP: $start"
    "WORKING_DIRECTORY: $workingDirectory"
    "TARGET_SHA: $TargetSha"
    "--- RAW OUTPUT BEGIN ---"
) -join "`n"

try {
    & $Executable @ArgumentList 2>&1 | Tee-Object -FilePath $temporaryOutput
    $exitCode = $LASTEXITCODE
    if ($null -eq $exitCode) { $exitCode = 0 }
} catch {
    $_ | Out-String | Set-Content -LiteralPath $temporaryOutput -Encoding utf8
    $exitCode = 1
}

$raw = ""
if (Test-Path -LiteralPath $temporaryOutput) {
    $raw = [System.IO.File]::ReadAllText($temporaryOutput)
    $raw = $raw -replace "`r`n", "`n" -replace "`r", "`n"
    $raw = $raw.TrimEnd("`n")
    Remove-Item -LiteralPath $temporaryOutput -Force
}

$end = Get-Date -Format o
$document = $header + "`n" + $raw + "`n" + (@(
    "--- RAW OUTPUT END ---"
    "EXIT_CODE: $exitCode"
    "END_TIMESTAMP: $end"
) -join "`n") + "`n"

[System.IO.File]::WriteAllText($LogPath, $document, $utf8NoBom)
exit $exitCode
