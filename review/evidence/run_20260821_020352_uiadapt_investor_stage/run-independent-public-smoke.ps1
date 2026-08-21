$ErrorActionPreference = 'Stop'
$secret = (& ssh nwg "sudo -n cat /etc/uiadapt-demo/password")
if ($LASTEXITCODE -ne 0) { throw 'credential read failed' }
$secret = [string]$secret
if ([string]::IsNullOrEmpty($secret)) { throw 'credential is empty' }

$env:UIADAPT_PUBLIC_USER = 'reviewer'
$env:UIADAPT_PUBLIC_PASSWORD = $secret
$verifier = Join-Path $PSScriptRoot 'independent-public-smoke.mjs'

try {
  & node $verifier
  $nodeExitCode = $LASTEXITCODE
  if ($nodeExitCode -ne 0) { throw "public smoke failed with exit code $nodeExitCode" }
}
finally {
  Remove-Item Env:\UIADAPT_PUBLIC_USER -ErrorAction SilentlyContinue
  Remove-Item Env:\UIADAPT_PUBLIC_PASSWORD -ErrorAction SilentlyContinue
  $secret = $null
}
