#Requires -Version 5.1
# Starts only the LocalStack container from the repo's existing docker-compose
# file (profile "localstack"), so Terraform has something to talk to on
# http://localhost:4566.
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')

Push-Location $root
try {
  docker compose -f docker-compose.gateway.yml --profile localstack up -d localstack
} finally {
  Pop-Location
}

Write-Host "LocalStack is starting on http://localhost:4566 (health: /_localstack/health)" -ForegroundColor Green
