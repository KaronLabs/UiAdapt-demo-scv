param(
  [Parameter(Mandatory = $true)]
  [string]$Worktree,

  [Parameter(Mandatory = $true)]
  [string]$EvidenceRoot
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$rawRoot = Join-Path $EvidenceRoot "raw"
New-Item -ItemType Directory -Path $rawRoot -Force | Out-Null

$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$git = (Get-Command git.exe -ErrorAction Stop).Source

$steps = @(
  @{ Id = "01"; Slug = "npm-ci"; Command = "npm ci"; File = $npm; Args = @("ci") },
  @{ Id = "02"; Slug = "lint"; Command = "npm run lint"; File = $npm; Args = @("run", "lint") },
  @{ Id = "03"; Slug = "vitest"; Command = "npm test"; File = $npm; Args = @("test") },
  @{ Id = "04"; Slug = "gateway"; Command = "npm run test:gateway"; File = $npm; Args = @("run", "test:gateway") },
  @{ Id = "05"; Slug = "deployment"; Command = "npm run test:deployment"; File = $npm; Args = @("run", "test:deployment") },
  @{ Id = "06"; Slug = "build-bases"; Command = "npm run verify:build-bases"; File = $npm; Args = @("run", "verify:build-bases") },
  @{ Id = "07"; Slug = "build-nwg"; Command = "npm run build:nwg"; File = $npm; Args = @("run", "build:nwg") },
  @{ Id = "08"; Slug = "playwright"; Command = "npm run test:e2e"; File = $npm; Args = @("run", "test:e2e") },
  @{ Id = "09"; Slug = "audit-production"; Command = "npm audit --omit=dev --audit-level=high"; File = $npm; Args = @("audit", "--omit=dev", "--audit-level=high") },
  @{ Id = "10"; Slug = "git-diff-check"; Command = "git diff --check"; File = $git; Args = @("diff", "--check") }
)

$summary = [System.Collections.Generic.List[object]]::new()
$campaignStart = [DateTimeOffset]::UtcNow
$overallStatus = "PHASE1_GO"

foreach ($step in $steps) {
  $prefix = "phase1-$($step.Id)-$($step.Slug)"
  $stdoutPath = Join-Path $rawRoot "$prefix.stdout.log"
  $stderrPath = Join-Path $rawRoot "$prefix.stderr.log"
  $receiptPath = Join-Path $rawRoot "$prefix.receipt.json"
  $started = [DateTimeOffset]::UtcNow

  $process = Start-Process `
    -FilePath $step.File `
    -ArgumentList $step.Args `
    -WorkingDirectory $Worktree `
    -NoNewWindow `
    -Wait `
    -PassThru `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath

  $ended = [DateTimeOffset]::UtcNow
  $receipt = [ordered]@{
    command = $step.Command
    cwd = $Worktree
    role = "r8_deployment_operator_phase1"
    start_utc = $started.ToString("o")
    end_utc = $ended.ToString("o")
    duration_ms = [math]::Round(($ended - $started).TotalMilliseconds)
    exit_code = $process.ExitCode
    stdout_file = (Resolve-Path -LiteralPath $stdoutPath).Path
    stderr_file = (Resolve-Path -LiteralPath $stderrPath).Path
    observation = if ($process.ExitCode -eq 0) { "command completed with exit code 0" } else { "command failed; phase stopped without packaging" }
    redaction_applied = $false
  }
  $receipt | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $receiptPath -Encoding utf8NoBOM
  $summary.Add([pscustomobject]$receipt)

  if ($process.ExitCode -ne 0) {
    $overallStatus = "PHASE1_NO_GO"
    break
  }
}

$campaignEnd = [DateTimeOffset]::UtcNow
$summaryDocument = [ordered]@{
  phase = "source-gate"
  status = $overallStatus
  worktree = $Worktree
  expected_head = "00c4c47a63f859d33b4264f6e6ddb3c5ef71913b"
  start_utc = $campaignStart.ToString("o")
  end_utc = $campaignEnd.ToString("o")
  commands_planned = $steps.Count
  commands_executed = $summary.Count
  receipts = $summary
}
$summaryDocument | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $EvidenceRoot "phase1-source-gate-summary.json") -Encoding utf8NoBOM

Write-Output $overallStatus
exit $(if ($overallStatus -eq "PHASE1_GO") { 0 } else { 1 })
