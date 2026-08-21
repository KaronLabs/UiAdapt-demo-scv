$ErrorActionPreference = 'Stop'

$screenshots = Get-ChildItem `
  'review/evidence/run_20260821_020352_uiadapt_investor_stage/screenshots' `
  -File `
  -Filter '*.png' | Sort-Object Name

if ($screenshots.Count -ne 18) {
  throw "Expected 18 screenshots, found $($screenshots.Count)"
}

foreach ($screenshot in $screenshots) {
  $hash = (Get-FileHash -Algorithm SHA256 $screenshot.FullName).Hash.ToLowerInvariant()
  '{0} {1} {2}' -f $screenshot.Name, $screenshot.Length, $hash
}
