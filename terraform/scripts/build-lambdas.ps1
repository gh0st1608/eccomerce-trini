#Requires -Version 5.1
# Builds the Lambda deployment zip for both backends (npm prune + tar), so
# Terraform has dist/lambda.zip to reference. Run this before `terraform apply`.
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')

foreach ($service in @('ecommerce', 'admin')) {
  $servicePath = Join-Path $root $service
  Write-Host "==> Building Lambda package for $service" -ForegroundColor Cyan
  Push-Location $servicePath
  try {
    npm ci
    npm run build
  } finally {
    Pop-Location
  }
}

Write-Host "Done. dist/lambda.zip is ready in ecommerce/ and admin/." -ForegroundColor Green
