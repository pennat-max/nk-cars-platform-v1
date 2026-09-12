param(
  [int]$PollIntervalSeconds = 30,
  [switch]$Once,
  [switch]$ConnectivityOnly
)

$ErrorActionPreference = "Stop"

function Require-Env {
  param([string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "$Name is required in the current shell. Do not store the value in Git."
  }
  return $value.TrimEnd("/")
}

function Invoke-NkJson {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [object]$Body = $null
  )
  $payload = $null
  if ($null -ne $Body) {
    $payload = $Body | ConvertTo-Json -Depth 20 -Compress
  }
  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers -Body $payload -ContentType "application/json"
}

$apiBaseUrl = Require-Env "NK_API_BASE_URL"
$workerToken = Require-Env "NK_HERMES_WORKER_TOKEN"
$workerId = [Environment]::GetEnvironmentVariable("NK_WORKER_ID", "Process")
if ([string]::IsNullOrWhiteSpace($workerId)) {
  $workerId = "jaklaen-hermes"
}
if ($workerId -ne "jaklaen-hermes") {
  throw "NK_WORKER_ID must be jaklaen-hermes for Issue #1."
}

$headers = @{
  Authorization = "Bearer $workerToken"
  "x-nk-worker-id" = $workerId
}

Write-Host "Jaklaen preview worker started for $apiBaseUrl as $workerId"
Write-Host "No token value is printed or saved. Production is not touched."

do {
  $claim = Invoke-NkJson -Method "POST" -Url "$apiBaseUrl/v1/worker/jaklaen/jobs/claim" -Headers $headers
  if ($null -eq $claim.job) {
    Write-Host "No queued job. Sleeping $PollIntervalSeconds seconds."
    if ($Once) { break }
    Start-Sleep -Seconds $PollIntervalSeconds
    continue
  }

  $job = $claim.job
  Write-Host "Claimed job $($job.id) for request $($job.requestId)"
  Invoke-NkJson -Method "POST" -Url "$apiBaseUrl/v1/worker/jaklaen/jobs/$($job.id)/heartbeat" -Headers $headers -Body @{
    browserProfileState = $(if ($ConnectivityOnly) { "not_configured" } else { "ready" })
    currentStage = $(if ($ConnectivityOnly) { "api_connectivity_only" } else { "claimed" })
    listingsInspected = 0
    candidatesReturned = 0
    message = $(if ($ConnectivityOnly) { "API connectivity heartbeat only. Real Facebook search worker is not attached." } else { "Jaklaen claimed the job and is starting the approved search flow." })
  } | Out-Null

  if ($ConnectivityOnly) {
    Invoke-NkJson -Method "POST" -Url "$apiBaseUrl/v1/worker/jaklaen/jobs/$($job.id)/complete" -Headers $headers -Body @{
      status = "BLOCKED"
      blockedReason = "ACCOUNT_RISK"
      listingsFound = 0
      candidatesReturned = 0
      message = "Connectivity-only worker stopped before source access. Attach the real Jaklaen search runtime for final Toyota Hilux Revo proof."
    } | Out-Null
    Write-Host "Connectivity-only job marked BLOCKED without source access."
  } else {
    Write-Host "Hand off job $($job.id) to the real Jaklaen search runtime, then submit candidates and complete the job."
  }

  if ($Once) { break }
  Start-Sleep -Seconds $PollIntervalSeconds
} while ($true)
