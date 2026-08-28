param(
  [string]$QnapHost = "192.168.0.132",
  [string]$QnapUser = "admin",
  [string]$RuleId = "7412f2fb-fe79-4469-b36b-96d3c55daa3a",
  [int]$LocalDataApiPort = 13001,
  [int]$ConnectorPort = 4317,
  [string]$WorkerId = "hermes-qnap-activation",
  [string]$ProfileId = "fb-buyer-01"
)

$ErrorActionPreference = "Stop"
$repo = Resolve-Path (Join-Path $PSScriptRoot "..")
$resultPath = Join-Path $env:TEMP "nk-hermes-qnap-pilot-result.json"
$connectorOut = Join-Path $env:TEMP "nk-hermes-connector.out.log"
$connectorErr = Join-Path $env:TEMP "nk-hermes-connector.err.log"
$workerLog = Join-Path $env:TEMP "nk-hermes-worker.log"

function Write-Result($payload) {
  $payload | ConvertTo-Json -Depth 8 | Set-Content -Path $resultPath -Encoding UTF8
}

function Safe-Text($value) {
  $text = "$value"
  $text = $text -replace '(?i)(password|token|secret|cookie)=\S+', '$1=[redacted]'
  return $text
}

function Invoke-Qnap($session, [string]$command, [string]$label = "qnap_command") {
  $result = Invoke-SSHCommand -SSHSession $session -Command $command -TimeOut 120
  if ($result.ExitStatus -ne 0) {
    $details = @()
    if ($result.Error) { $details += ($result.Error | ForEach-Object { Safe-Text $_ }) }
    if ($result.Output) { $details += ($result.Output | Select-Object -First 3 | ForEach-Object { Safe-Text $_ }) }
    throw "$label failed with exit $($result.ExitStatus): $($details -join ' | ')"
  }
  return $result.Output
}

function Read-QnapEnv($session) {
  $lines = Invoke-Qnap $session "set -a; . /share/CACHEDEV6_DATA/nk-cars/.env.full; printf 'NK_INTERNAL_API_TOKEN=%s\nNK_HERMES_WORKER_TOKEN=%s\n' `"`$NK_INTERNAL_API_TOKEN`" `"`$NK_HERMES_WORKER_TOKEN`"" "read_qnap_env"
  $values = @{}
  foreach ($line in $lines) {
    $index = $line.IndexOf("=")
    if ($index -gt 0) {
      $values[$line.Substring(0, $index)] = $line.Substring($index + 1)
    }
  }
  if (($values["NK_INTERNAL_API_TOKEN"] | ForEach-Object { "$_" }).Length -lt 20) { throw "missing_internal_api_token" }
  if (($values["NK_HERMES_WORKER_TOKEN"] | ForEach-Object { "$_" }).Length -lt 32) { throw "missing_worker_token" }
  return $values
}

function Read-QnapContainerIp($session, [string]$containerName) {
  $command = @"
docker_bin="`$(command -v docker || true)"
if [ -z "`$docker_bin" ]; then
  for candidate in /usr/local/bin/docker /share/CACHEDEV1_DATA/.qpkg/container-station/bin/docker /share/CACHEDEV2_DATA/.qpkg/container-station/bin/docker /share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker
  do
    if [ -x "`$candidate" ]; then docker_bin="`$candidate"; break; fi
  done
fi
if [ -z "`$docker_bin" ]; then printf 'docker_not_found\n' >&2; exit 127; fi
"`$docker_bin" inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $containerName
"@
  $ip = (Invoke-Qnap $session $command "inspect_$containerName" | Select-Object -First 1).Trim()
  if ($ip -notmatch '^\d{1,3}(\.\d{1,3}){3}$') { throw "invalid_${containerName}_ip" }
  return $ip
}

function New-Token {
  $bytes = [byte[]]::new(32)
  $rng = [Security.Cryptography.RNGCryptoServiceProvider]::new()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  return ([BitConverter]::ToString($bytes) -replace "-", "").ToLowerInvariant()
}

function Invoke-Json($Uri, $Token, $Method = "GET", $Body = $null, $Headers = @{}) {
  $requestHeaders = @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" }
  foreach ($key in $Headers.Keys) { $requestHeaders[$key] = $Headers[$key] }
  if ($null -eq $Body) {
    return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $requestHeaders -TimeoutSec 20
  }
  return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $requestHeaders -Body ($Body | ConvertTo-Json -Depth 8) -TimeoutSec 20
}

Set-Location $repo
Import-Module Posh-SSH
$credential = Get-Credential -UserName $QnapUser -Message "Enter QNAP SSH credential for NK Cars Hermes pilot. Password is not saved."
$session = $null
$tunnel = $null
$connector = $null

try {
  Write-Result @{ status = "starting"; message = "Connecting to QNAP." }
  $session = New-SSHSession -ComputerName $QnapHost -Credential $credential -AcceptKey
  $backupCommand = @'
mkdir -p /share/CACHEDEV6_DATA/nk-cars/backups/postgres
set -a
. /share/CACHEDEV6_DATA/nk-cars/.env.full
docker_bin="$(command -v docker || true)"
if [ -z "$docker_bin" ]; then
  for candidate in \
    /usr/local/bin/docker \
    /share/CACHEDEV1_DATA/.qpkg/container-station/bin/docker \
    /share/CACHEDEV2_DATA/.qpkg/container-station/bin/docker \
    /share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker
  do
    if [ -x "$candidate" ]; then docker_bin="$candidate"; break; fi
  done
fi
if [ -z "$docker_bin" ]; then
  printf 'docker_not_found\n' >&2
  exit 127
fi
ts="$(date -u +%Y%m%dT%H%M%SZ)"
out="/share/CACHEDEV6_DATA/nk-cars/backups/postgres/nk-cars-before-hermes-profile-pilot-$ts.dump"
"$docker_bin" exec -e PGPASSWORD="$NK_CARS_DB_ADMIN_PASSWORD" tony-nk-cars-postgres pg_dump -U nk_cars_admin -d nk_cars -Fc > "$out" &&
sha256sum "$out" > "$out.sha256" &&
printf '%s\n' "$out"
'@
  $backupPath = Invoke-Qnap $session $backupCommand "postgres_backup"
  $secrets = Read-QnapEnv $session
  $dataApiAddress = Read-QnapContainerIp $session "tony-nk-cars-data"
  Write-Host "Opening private tunnel to QNAP Data API container $dataApiAddress:3001."
  New-SSHLocalPortForward -SSHSession $session -BoundHost "127.0.0.1" -BoundPort $LocalDataApiPort -RemoteAddress $dataApiAddress -RemotePort 3001 | Out-Null
  $portReady = $false
  for ($attempt = 0; $attempt -lt 90; $attempt += 1) {
    Start-Sleep -Seconds 1
    if (Test-NetConnection 127.0.0.1 -Port $LocalDataApiPort -InformationLevel Quiet) {
      $portReady = $true
      break
    }
  }
  if (-not $portReady) { throw "qnap_data_api_tunnel_not_started" }

  $connectorToken = New-Token
  $start = New-Object System.Diagnostics.ProcessStartInfo
  $start.FileName = "node"
  $start.Arguments = "marketplace-connector/server.mjs"
  $start.WorkingDirectory = "$repo"
  $start.UseShellExecute = $false
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.EnvironmentVariables["NK_CONNECTOR_TOKEN"] = $connectorToken
  $start.EnvironmentVariables["NK_CONNECTOR_PORT"] = "$ConnectorPort"
  $start.EnvironmentVariables["NK_CONNECTOR_BROWSER_CHANNEL"] = "chrome"
  $start.EnvironmentVariables["NK_CONNECTOR_HEADLESS"] = "true"
  $start.EnvironmentVariables["NK_CONNECTOR_PROFILE_ID"] = $ProfileId
  $connector = [System.Diagnostics.Process]::Start($start)

  Start-Sleep -Seconds 3
  if ($connector.HasExited) {
    $stdout = $connector.StandardOutput.ReadToEnd()
    $stderr = $connector.StandardError.ReadToEnd()
    Set-Content -Path $connectorOut -Value (Safe-Text $stdout) -Encoding UTF8
    Set-Content -Path $connectorErr -Value (Safe-Text $stderr) -Encoding UTF8
    throw "connector_start_failed"
  }
  Invoke-RestMethod -Uri "http://127.0.0.1:$ConnectorPort/health" -TimeoutSec 10 | Out-Null
  $profile = Invoke-Json "http://127.0.0.1:$ConnectorPort/v1/profiles/$ProfileId/check" $connectorToken "POST" @{}
  if ($profile.state -ne "ready") { throw "facebook_login_required" }

  $actorHeaders = @{
    "x-nk-actor-id" = "owner-hermes-pilot"
    "x-nk-actor-email" = "owner@nk.local"
    "x-nk-actor-roles" = "OWNER"
  }
  $baseQnap = "http://127.0.0.1:$LocalDataApiPort"
  $beforeSnapshot = Invoke-Json "$baseQnap/v1/admin/sourcing" $secrets["NK_INTERNAL_API_TOKEN"] "GET" $null $actorHeaders
  $commandQueued = $false
  if ([int]$beforeSnapshot.queueDepth -lt 1) {
    Invoke-Json "$baseQnap/v1/admin/sourcing/commands" $secrets["NK_INTERNAL_API_TOKEN"] "POST" @{
      action = "run_now"
      ruleId = $RuleId
      idempotencyKey = [guid]::NewGuid().ToString()
    } $actorHeaders | Out-Null
    $commandQueued = $true
  }

  $env:NK_QNAP_DATA_API_URL = $baseQnap
  $env:NK_HERMES_WORKER_TOKEN = $secrets["NK_HERMES_WORKER_TOKEN"]
  $env:NK_CONNECTOR_URL = "http://127.0.0.1:$ConnectorPort"
  $env:NK_CONNECTOR_TOKEN = $connectorToken
  $env:NK_HERMES_WORKER_ID = $WorkerId
  $env:NK_CONNECTOR_PROFILE_ID = $ProfileId
  $worker = & node --input-type=module -e "import { loadQnapWorkerConfig, runQnapWorkerOnce } from './marketplace-connector/qnap-worker.mjs'; const result = await runQnapWorkerOnce(loadQnapWorkerConfig()); console.log(JSON.stringify(result));" 2>&1
  $workerText = ($worker | ForEach-Object { Safe-Text $_ }) -join "`n"
  Set-Content -Path $workerLog -Value $workerText -Encoding UTF8
  if ($LASTEXITCODE -ne 0) { throw "worker_process_failed: $workerText" }
  $workerLine = $worker | Select-Object -Last 1
  if (-not $workerLine) { throw "worker_no_output" }
  $workerResult = $workerLine | ConvertFrom-Json
  $snapshot = Invoke-Json "$baseQnap/v1/admin/sourcing" $secrets["NK_INTERNAL_API_TOKEN"] "GET" $null $actorHeaders

  Write-Result @{
    status = "completed"
    backupPath = ($backupPath | Select-Object -First 1)
    commandQueued = $commandQueued
    worker = $workerResult
    hermesState = $snapshot.hermesState
    browserProfileState = $snapshot.browserProfileState
    processedToday = $snapshot.processedToday
    queueDepth = $snapshot.queueDepth
    message = $snapshot.message
    safety = "No publish, seller message, purchase, reservation, or payment command was issued by this script."
  }
} catch {
  Write-Result @{
    status = "stopped"
    safeErrorCode = (Safe-Text $_)
    safety = "Stopped without publish, seller message, purchase, reservation, or payment."
  }
} finally {
  if ($connector -and -not $connector.HasExited) { $connector.Kill() }
  Stop-SSHPortForward -SSHSession $session -BoundHost "127.0.0.1" -BoundPort $LocalDataApiPort -ErrorAction SilentlyContinue
  if ($session) { Remove-SSHSession -SSHSession $session | Out-Null }
  Remove-Item Env:NK_QNAP_DATA_API_URL,Env:NK_HERMES_WORKER_TOKEN,Env:NK_CONNECTOR_URL,Env:NK_CONNECTOR_TOKEN,Env:NK_HERMES_WORKER_ID,Env:NK_CONNECTOR_PROFILE_ID -ErrorAction SilentlyContinue
}

Write-Host "NK Hermes QNAP pilot result:"
Get-Content $resultPath
