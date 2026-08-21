$ErrorActionPreference = "Stop"

$holder = Start-Process -FilePath node.exe -ArgumentList "review\r8_20260821_174851\evidence\hold-5173.mjs" -WorkingDirectory $PWD -WindowStyle Hidden -PassThru

try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 50; $attempt += 1) {
    if ($holder.HasExited) {
      throw "Dummy 5173 listener exited before readiness (exit $($holder.ExitCode))"
    }
    try {
      $client = [System.Net.Sockets.TcpClient]::new()
      $client.Connect("127.0.0.1", 5173)
      $client.Dispose()
      $ready = $true
      break
    } catch {
      Start-Sleep -Milliseconds 100
    }
  }
  if (-not $ready) { throw "Dummy 5173 listener did not start" }
  if ($holder.HasExited) { throw "Dummy 5173 listener exited after readiness" }
  Write-Output "DUMMY_5173=LISTENING"
  & npm.cmd run test:deployment
  $testExit = $LASTEXITCODE
  Write-Output "DEPLOYMENT_TEST_EXIT=$testExit"
  if ($testExit -ne 0) { exit $testExit }
  Write-Output "PORT_ISOLATION=PASS"
} finally {
  if (-not $holder.HasExited) {
    Stop-Process -Id $holder.Id -Force
    $holder.WaitForExit()
  }
}
