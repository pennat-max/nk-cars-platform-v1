param(
  [string]$QnapHost = "192.168.0.132",
  [string]$QnapUser = "admin",
  [string]$RuleId = "7412f2fb-fe79-4469-b36b-96d3c55daa3a",
  [int]$LocalDataApiPort = 13001
)

$ErrorActionPreference = "Stop"
$resultPath = Join-Path $env:TEMP "nk-hermes-qnap-rule-update-result.json"

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
  $lines = Invoke-Qnap $session "set -a; . /share/CACHEDEV6_DATA/nk-cars/.env.full; printf 'NK_INTERNAL_API_TOKEN=%s\n' `"`$NK_INTERNAL_API_TOKEN`"" "read_qnap_env"
  $values = @{}
  foreach ($line in $lines) {
    $index = $line.IndexOf("=")
    if ($index -gt 0) {
      $values[$line.Substring(0, $index)] = $line.Substring($index + 1)
    }
  }
  if (($values["NK_INTERNAL_API_TOKEN"] | ForEach-Object { "$_" }).Length -lt 20) { throw "missing_internal_api_token" }
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
      $stream = $response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $bodyText = $reader.ReadToEnd()
      $reader.Close()
      try {
        $bodyJson = $bodyText | ConvertFrom-Json
        if ($bodyJson.error) { throw "$($bodyJson.error)" }
      } catch {
        throw
      }
    }
    throw
  }
}

Import-Module Posh-SSH
$credential = Get-Credential -UserName $QnapUser -Message "Enter QNAP SSH credential to update the NK Cars Hermes pilot rule. Password is not saved."
$session = $null
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
out="/share/CACHEDEV6_DATA/nk-cars/backups/postgres/nk-cars-before-hermes-rule-update-$ts.dump"
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

  $actorHeaders = @{
    "x-nk-actor-id" = "owner-hermes-rule-update"
    "x-nk-actor-email" = "owner@nk.local"
    "x-nk-actor-roles" = "OWNER"
  }
  $baseQnap = "http://127.0.0.1:$LocalDataApiPort"
  $snapshot = Invoke-Json "$baseQnap/v1/admin/sourcing" $secrets["NK_INTERNAL_API_TOKEN"] "GET" $null $actorHeaders
  $current = @($snapshot.rules) | Where-Object { $_.id -eq $RuleId } | Select-Object -First 1
  if (-not $current) { throw "rule_not_found" }

  $rule = @{
    name = "Toyota Revo 2020+ - Bangkok Metro pilot"
    active = $true
    brand = "Toyota"
    model = "Revo"
    bodyType = "pickup"
    yearFrom = 2020
    yearTo = 2026
    maxSourcePriceThb = $null
    dailyLimit = 1
    priority = "normal"
    locations = @("Bangkok", "Nonthaburi", "Pathum Thani", "Samut Prakan", "Samut Sakhon", "Nakhon Pathom")
    requiredKeywords = @("revo")
    excludedKeywords = @()
    sourceAdapter = "facebook_marketplace"
    schedule = @{
      timezone = "Asia/Bangkok"
      weekdays = @("mon", "tue", "wed", "thu", "fri", "sat", "sun")
      startHour = 8
      endHour = 20
    }
  }

  $updated = Invoke-Json "$baseQnap/v1/admin/sourcing/rules/$RuleId" $secrets["NK_INTERNAL_API_TOKEN"] "PUT" @{
    rule = $rule
    expectedRevision = $current.revision
  } $actorHeaders
  $newRule = @($updated.rules) | Where-Object { $_.id -eq $RuleId } | Select-Object -First 1

  Write-Result @{
    status = "completed"
    backupPath = ($backupPath | Select-Object -First 1)
    ruleId = $RuleId
    oldRevision = $current.revision
    newRevision = $newRule.revision
    rule = @{
      name = $newRule.name
      active = $newRule.active
      brand = $newRule.brand
      model = $newRule.model
      yearFrom = $newRule.yearFrom
      yearTo = $newRule.yearTo
      locations = $newRule.locations
      dailyLimit = $newRule.dailyLimit
    }
    safety = "Rule update only. No publish, seller message, purchase, reservation, or payment command was issued by this script."
  }
} catch {
  Write-Result @{
    status = "stopped"
    backupPath = ($backupPath | Select-Object -First 1)
    safeErrorCode = (Safe-Text $_)
    safety = "Stopped without publish, seller message, purchase, reservation, or payment."
  }
} finally {
  Stop-SSHPortForward -SSHSession $session -BoundHost "127.0.0.1" -BoundPort $LocalDataApiPort -ErrorAction SilentlyContinue
  if ($session) { Remove-SSHSession -SSHSession $session | Out-Null }
}

Write-Host "NK Hermes QNAP rule update result:"
Get-Content $resultPath
