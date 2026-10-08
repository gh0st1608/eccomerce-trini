#Requires -Version 5.1
# Builds frontend-ecommerce for production with the New Relic Browser (RUM) settings taken
# from Terraform (output new_relic_browser_config), so they are never copied by hand into
# a .env file. Everything else comes from frontend-ecommerce/.env.production as usual.
#
#   .\terraform\scripts\build-frontend.ps1
#   .\terraform\scripts\deploy-frontend.ps1
#
# Vite gives variables already present in the environment priority over .env files.
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$terraformDir = Join-Path $root 'terraform'
$frontendDir = Join-Path $root 'frontend-ecommerce'

Push-Location $terraformDir
try {
  $browserConfigJson = terraform output -json new_relic_browser_config
  if ($LASTEXITCODE -ne 0) { throw 'terraform output new_relic_browser_config failed' }
} finally {
  Pop-Location
}

$browserConfig = $browserConfigJson | ConvertFrom-Json
if ($null -eq $browserConfig) {
  Write-Warning 'new_relic_browser_config is null (no New Relic API key in Terraform): building without Browser RUM.'
} else {
  $env:VITE_NEW_RELIC_BROWSER_ACCOUNT_ID = $browserConfig.account_id
  $env:VITE_NEW_RELIC_BROWSER_TRUST_KEY = $browserConfig.trust_key
  $env:VITE_NEW_RELIC_BROWSER_AGENT_ID = $browserConfig.agent_id
  $env:VITE_NEW_RELIC_BROWSER_LICENSE_KEY = $browserConfig.license_key
  Write-Host "==> New Relic Browser enabled (agent $($browserConfig.agent_id))" -ForegroundColor Cyan
}

Push-Location $frontendDir
try {
  Write-Host '==> Building frontend-ecommerce' -ForegroundColor Cyan
  # Vite prints warnings on stderr; with 'Stop' Windows PowerShell would abort on them, so rely
  # on the exit code instead.
  $ErrorActionPreference = 'Continue'
  npm run build
  $buildExitCode = $LASTEXITCODE
  $ErrorActionPreference = 'Stop'
  if ($buildExitCode -ne 0) { throw "npm run build failed (exit code $buildExitCode)" }
} finally {
  Pop-Location
  Remove-Item Env:VITE_NEW_RELIC_BROWSER_* -ErrorAction SilentlyContinue
}

Write-Host "Done. Build ready in $frontendDir\dist" -ForegroundColor Green
