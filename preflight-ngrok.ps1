param(
  [string]$ComposeFile = "docker-compose.gateway.yml",
  [switch]$AutoStart,
  [string]$PublicApiToken = $(if ($env:PUBLIC_API_TOKEN) { $env:PUBLIC_API_TOKEN } else { "trini-public-readonly-token" })
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "[STEP] $Message"
}

function Write-Ok {
  param([string]$Message)
  Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Write-Fail {
  param([string]$Message)
  Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Get-NgrokUrlFromLogs {
  param([string]$ComposeFilePath)
  $logs = docker compose -f $ComposeFilePath logs --no-color ngrok --tail 120 2>$null
  if (-not $logs) {
    return $null
  }

  $match = [regex]::Match(($logs -join "`n"), "https://[a-z0-9\-]+\.ngrok-free\.app")
  if ($match.Success) {
    return $match.Value
  }

  return $null
}

function Invoke-Check {
  param(
    [string]$Name,
    [scriptblock]$Check
  )

  try {
    & $Check
    Write-Ok $Name
    return $true
  } catch {
    Write-Fail "$Name -> $($_.Exception.Message)"
    return $false
  }
}

Assert-Command "docker"
Assert-Command "docker"

if (-not (Test-Path $ComposeFile)) {
  throw "Compose file not found: $ComposeFile"
}

if ($AutoStart) {
  Write-Step "Starting stack (gateway + ngrok profile)..."
  docker compose --env-file .env --profile ngrok -f $ComposeFile up -d --build | Out-Null
  Write-Ok "Stack start command executed"
}

Write-Step "Checking running services"
$psOutput = docker compose -f $ComposeFile ps
if (-not $psOutput) {
  throw "Could not read docker compose status"
}

$requiredServices = @("ecommerce-api", "admin-api", "frontend", "gateway", "ngrok")
$statusText = $psOutput -join "`n"
foreach ($service in $requiredServices) {
  if ($statusText -notmatch $service) {
    Write-Fail "Service not listed: $service"
    exit 1
  }
}
Write-Ok "Required services are listed in docker compose ps"

Write-Step "Resolving ngrok public URL"
$ngrokUrl = Get-NgrokUrlFromLogs -ComposeFilePath $ComposeFile
if (-not $ngrokUrl) {
  Write-Fail "Could not extract ngrok URL from logs"
  exit 1
}
Write-Ok "Public URL: $ngrokUrl"

$allPassed = $true

$allPassed = (Invoke-Check -Name "Public home responds with HTML" -Check {
  $response = Invoke-WebRequest -Uri "$ngrokUrl/" -UseBasicParsing -TimeoutSec 25
  if ($response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode)" }
  if ($response.Content -notmatch '<div id="root"></div>') { throw "Missing SPA root element" }
}) -and $allPassed

$allPassed = (Invoke-Check -Name "Catalog API responds" -Check {
  $response = Invoke-WebRequest -Uri "$ngrokUrl/api/v1/products" -UseBasicParsing -TimeoutSec 25
  if ($response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode)" }
  $payload = $response.Content | ConvertFrom-Json
  if (-not $payload.success) { throw "API success=false" }
  if (-not $payload.data.products -or $payload.data.products.Count -lt 1) { throw "No products returned" }
}) -and $allPassed

$productPayload = Invoke-WebRequest -Uri "$ngrokUrl/api/v1/products" -UseBasicParsing -TimeoutSec 25 | Select-Object -ExpandProperty Content | ConvertFrom-Json
$productId = $productPayload.data.products[0].id

$allPassed = (Invoke-Check -Name "Deep link route responds (/products/:id)" -Check {
  $response = Invoke-WebRequest -Uri "$ngrokUrl/products/$productId" -UseBasicParsing -TimeoutSec 25
  if ($response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode)" }
  if ($response.Content -notmatch '<div id="root"></div>') { throw "Missing SPA root for route" }
}) -and $allPassed

$allPassed = (Invoke-Check -Name "Pickup stores API responds" -Check {
  $response = Invoke-WebRequest -Uri "$ngrokUrl/api/v1/admin/stores/pickup" -Headers @{ Authorization = "Bearer $PublicApiToken" } -UseBasicParsing -TimeoutSec 25
  if ($response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode)" }
  $payload = $response.Content | ConvertFrom-Json
  if (-not $payload.success) { throw "API success=false" }
  if (-not $payload.data.stores) { throw "Missing stores list" }
}) -and $allPassed

Write-Host ""
Write-Host "Public URL: $ngrokUrl"

if ($allPassed) {
  Write-Ok "Preflight passed"
  Write-Host "Manual mobile checks still recommended:" 
  Write-Host "1) Tap Ver detalle from home"
  Write-Host "2) Add variants and validate separate lines in cart"
  Write-Host "3) Finalizar por WhatsApp clears cart and returns home"
  exit 0
}

Write-Fail "Preflight failed"
exit 1
