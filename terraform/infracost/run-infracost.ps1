#Requires -Version 5.1
# Runs Infracost (via Docker, no local install needed) against the Terraform
# code and prints a cost breakdown table. Also writes an HTML report.
#
# Prerequisite: set INFRACOST_API_KEY (free key from https://www.infracost.io/).
#   $env:INFRACOST_API_KEY = "ico-xxxxxxxx"
#
# Usage:
#   .\terraform\infracost\run-infracost.ps1
param(
  [string]$Format = "table"
)

$ErrorActionPreference = 'Stop'

if (-not $env:INFRACOST_API_KEY) {
  Write-Error "INFRACOST_API_KEY is not set. Get a free key at https://www.infracost.io/ and run: `$env:INFRACOST_API_KEY = '<key>'"
  exit 1
}

$terraformRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

# Infracost needs `terraform plan` to succeed, which in turn needs the Lambda
# zip files to exist on disk (filebase64sha256 fails on a missing file). Create
# empty placeholders when the real build hasn't run yet - this does not affect
# the cost estimate, since pricing is based on resource attributes (memory,
# runtime), not the zip contents.
foreach ($service in @('ecommerce', 'admin')) {
  $distDir = Join-Path $terraformRoot "..\$service\dist"
  $zipPath = Join-Path $distDir 'lambda.zip'
  if (-not (Test-Path $zipPath)) {
    New-Item -ItemType Directory -Force -Path $distDir | Out-Null
    Set-Content -Path $zipPath -Value "placeholder" -NoNewline
    Write-Host "Created placeholder $zipPath (run terraform/scripts/build-lambdas.ps1 for a real one)" -ForegroundColor Yellow
  }
}

$reportDir = Join-Path $terraformRoot 'infracost'
$outFile = "/code/terraform/infracost/infracost-report.$Format"
if ($Format -eq 'table') { $outFile = $null }

$dockerArgs = @(
  'run', '--rm',
  '-e', "INFRACOST_API_KEY=$env:INFRACOST_API_KEY",
  '-v', "$(Resolve-Path (Join-Path $terraformRoot '..')):/code",
  'infracost/infracost:ci-latest',
  'breakdown',
  '--config-file=/code/terraform/infracost/infracost.yml',
  "--format=$Format"
)

if ($outFile) {
  $dockerArgs += "--out-file=$outFile"
}

Write-Host "==> docker $($dockerArgs -join ' ')" -ForegroundColor Cyan
& docker @dockerArgs

if ($outFile) {
  Write-Host "Report written to $(Join-Path $reportDir "infracost-report.$Format")" -ForegroundColor Green
}
