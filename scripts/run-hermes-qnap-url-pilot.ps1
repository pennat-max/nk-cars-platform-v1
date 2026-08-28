param(
  [Parameter(Mandatory = $true)]
  [string]$SourceUrl,
  [string]$QnapHost = "192.168.0.132",
  [string]$QnapUser = "admin",
  [string]$RuleId = "7412f2fb-fe79-4469-b36b-96d3c55daa3a",
  [int]$LocalDataApiPort = 13001,
  [int]$ConnectorPort = 4317,
  [string]$WorkerId = "hermes-qnap-url-pilot",
  [string]$ProfileId = "fb-buyer-01"
)

$ErrorActionPreference = "Stop"
$repo = Resolve-Path (Join-Path $PSScriptRoot "..")
$resultPath = Join-Path $env:TEMP "nk-hermes-qnap-url-pilot-result.json"
$listingPath = Join-Path $env:TEMP "nk-hermes-qnap-url-pilot-listing.json"
$candidatePath = Join-Path $env:TEMP "nk-hermes-qnap-url-pilot-candidate.json"
$connectorOut = Join-Path $env:TEMP "nk-hermes-url-connector.out.log"
$connectorErr = Join-Path $env:TEMP "nk-hermes-url-connector.err.log"

function Write-Result($payload) {
  $payload | ConvertTo-Json -Depth 10 | Set-Content -Path $resultPath -Encoding UTF8
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

function Invoke-Json($Uri, $Token, $Method = "GET", $Body = $null, $Headers = @{}, $TimeoutSec = 20) {
  $requestHeaders = @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" }
  foreach ($key in $Headers.Keys) { $requestHeaders[$key] = $Headers[$key] }
  try {
    if ($null -eq $Body) {
      return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $requestHeaders -TimeoutSec $TimeoutSec
    }
    return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $requestHeaders -Body ($Body | ConvertTo-Json -Depth 10) -TimeoutSec $TimeoutSec
  } catch {
    $response = $_.Exception.Response
    if ($response) {
      try {
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $bodyText = $reader.ReadToEnd()
        $reader.Close()
        $bodyJson = $bodyText | ConvertFrom-Json
        if ($bodyJson.error) { throw "$($bodyJson.error)" }
        if ($bodyJson.safe_reason_code) { throw "$($bodyJson.safe_reason_code)" }
      } catch {
        throw
      }
    }
    throw
  }
}

Set-Location $repo
Import-Module Posh-SSH
$credential = Get-Credential -UserName $QnapUser -Message "Enter QNAP SSH credential for NK Cars Hermes URL pilot. Password is not saved."
$session = $null
$connector = $null
$claimedCommandId = $null
$completedCommand = $false
$baseQnap = $null
$secrets = $null
$backupPath = $null

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
out="/share/CACHEDEV6_DATA/nk-cars/backups/postgres/nk-cars-before-hermes-url-pilot-$ts.dump"
"$docker_bin" exec -e PGPASSWORD="$NK_CARS_DB_ADMIN_PASSWORD" tony-nk-cars-postgres pg_dump -U nk_cars_admin -d nk_cars -Fc > "$out" &&
sha256sum "$out" > "$out.sha256" &&
printf '%s\n' "$out"
'@
  $backupPath = Invoke-Qnap $session $backupCommand "postgres_backup"
  $secrets = Read-QnapEnv $session
  $dataApiAddress = Read-QnapContainerIp $session "tony-nk-cars-data"
  Write-Host "Opening private tunnel to QNAP Data API container ${dataApiAddress}:3001."
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
    Set-Content -Path $connectorOut -Value (Safe-Text $connector.StandardOutput.ReadToEnd()) -Encoding UTF8
    Set-Content -Path $connectorErr -Value (Safe-Text $connector.StandardError.ReadToEnd()) -Encoding UTF8
    throw "connector_start_failed"
  }
  Invoke-RestMethod -Uri "http://127.0.0.1:$ConnectorPort/health" -TimeoutSec 10 | Out-Null
  $profile = Invoke-Json "http://127.0.0.1:$ConnectorPort/v1/profiles/$ProfileId/check" $connectorToken "POST" @{}
  if ($profile.state -ne "ready") { throw "facebook_login_required" }

  $actorHeaders = @{
    "x-nk-actor-id" = "owner-hermes-url-pilot"
    "x-nk-actor-email" = "owner@nk.local"
    "x-nk-actor-roles" = "OWNER"
  }
  $baseQnap = "http://127.0.0.1:$LocalDataApiPort"
  $commandSnapshot = Invoke-Json "$baseQnap/v1/admin/sourcing/commands" $secrets["NK_INTERNAL_API_TOKEN"] "POST" @{
    action = "run_now"
    ruleId = $RuleId
    idempotencyKey = [guid]::NewGuid().ToString()
  } $actorHeaders

  $claim = Invoke-Json "$baseQnap/v1/worker/sourcing/commands/claim" $secrets["NK_HERMES_WORKER_TOKEN"] "POST" @{} @{ "x-nk-worker-id" = $WorkerId }
  if ($null -eq $claim.command) { throw "worker_command_not_claimed" }
  if ($claim.command.id -notmatch '^[0-9a-f-]{36}$') { throw "invalid_claimed_command" }
  $claimedCommandId = $claim.command.id

  $listing = Invoke-Json "http://127.0.0.1:$ConnectorPort/v1/facebook/import" $connectorToken "POST" @{
    source_url = $SourceUrl
    profile_id = $ProfileId
    max_images = 30
  } @{} 100
  $listing | ConvertTo-Json -Depth 10 | Set-Content -Path $listingPath -Encoding UTF8

  & node --input-type=module -e "import fs from 'node:fs'; import { normalizeCandidate } from './marketplace-connector/contracts.mjs'; const raw = fs.readFileSync(process.argv[1], 'utf8').replace(/^\uFEFF/, ''); const listing = JSON.parse(raw); const candidate = normalizeCandidate(listing, { search_request_id: 'owner_direct_url', search_run_id: 'owner_direct_url', adapter: 'facebook_direct_url_pilot' }); fs.writeFileSync(process.argv[2], JSON.stringify(candidate));" $listingPath $candidatePath
  if ($LASTEXITCODE -ne 0) { throw "candidate_normalize_failed" }
  $candidate = Get-Content -Raw $candidatePath | ConvertFrom-Json

  try {
    $ingested = Invoke-Json "$baseQnap/v1/worker/sourcing/candidates" $secrets["NK_HERMES_WORKER_TOKEN"] "POST" @{
      commandId = $claimedCommandId
      ruleId = $RuleId
      candidate = $candidate
    } @{ "x-nk-worker-id" = $WorkerId } 120
  } catch {
    Invoke-Json "$baseQnap/v1/worker/sourcing/commands/$claimedCommandId/complete" $secrets["NK_HERMES_WORKER_TOKEN"] "POST" @{
      state = "error"
      browserProfileState = "ready"
      processedIncrement = 0
      message = "Direct URL candidate failed rule validation or ingestion and requires review."
      safeErrorCode = (Safe-Text $_)
    } @{ "x-nk-worker-id" = $WorkerId } | Out-Null
    $completedCommand = $true
    throw
  }

  Invoke-Json "$baseQnap/v1/worker/sourcing/commands/$claimedCommandId/complete" $secrets["NK_HERMES_WORKER_TOKEN"] "POST" @{
    state = "ready"
    browserProfileState = "ready"
    processedIncrement = 0
    message = "Direct URL pilot completed safely."
    safeErrorCode = $null
  } @{ "x-nk-worker-id" = $WorkerId } | Out-Null
  $completedCommand = $true

  $snapshot = Invoke-Json "$baseQnap/v1/admin/sourcing" $secrets["NK_INTERNAL_API_TOKEN"] "GET" $null $actorHeaders
  $summary = Invoke-Json "$baseQnap/v1/admin/inventory-summary" $secrets["NK_INTERNAL_API_TOKEN"] "GET" $null $actorHeaders

  Write-Result @{
    status = "completed"
    backupPath = ($backupPath | Select-Object -First 1)
    commandQueued = $true
    commandId = $claimedCommandId
    listingStatus = $listing.status
    imageCount = @($listing.images).Count
    candidateId = $candidate.candidate_id
    worker = @{
      status = $ingested.status
      vehicleId = $ingested.vehicleId
      idempotent = $ingested.idempotent
      media = $ingested.media
    }
    hermesState = $snapshot.hermesState
    browserProfileState = $snapshot.browserProfileState
    processedToday = $snapshot.processedToday
    queueDepth = $snapshot.queueDepth
    inventorySummary = $summary.vehicles
    safety = "No publish, seller message, purchase, reservation, or payment command was issued by this script."
  }
} catch {
  if ($claimedCommandId -and -not $completedCommand -and $baseQnap -and $secrets) {
    try {
      Invoke-Json "$baseQnap/v1/worker/sourcing/commands/$claimedCommandId/complete" $secrets["NK_HERMES_WORKER_TOKEN"] "POST" @{
        state = "error"
        browserProfileState = "ready"
        processedIncrement = 0
        message = "Direct URL pilot stopped safely and requires review."
        safeErrorCode = (Safe-Text $_)
      } @{ "x-nk-worker-id" = $WorkerId } | Out-Null
      $completedCommand = $true
    } catch {
      $completedCommand = $false
    }
  }
  Write-Result @{
    status = "stopped"
    backupPath = ($backupPath | Select-Object -First 1)
    commandId = $claimedCommandId
    commandCompleted = $completedCommand
    safeErrorCode = (Safe-Text $_)
    safety = "Stopped without publish, seller message, purchase, reservation, or payment."
  }
} finally {
  if ($connector -and -not $connector.HasExited) { $connector.Kill() }
  Stop-SSHPortForward -SSHSession $session -BoundHost "127.0.0.1" -BoundPort $LocalDataApiPort -ErrorAction SilentlyContinue
  if ($session) { Remove-SSHSession -SSHSession $session | Out-Null }
}

Write-Host "NK Hermes QNAP URL pilot result:"
Get-Content $resultPath
