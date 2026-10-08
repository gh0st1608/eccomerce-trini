#Requires -Version 5.1
# Uploads the built storefront (frontend-ecommerce/dist) to the frontend bucket with
# Cache-Control per file type, then invalidates CloudFront. Run after `npm run build`
# in frontend-ecommerce and after `terraform apply` (it reads the bucket/CDN from outputs).
#
#   .\terraform\scripts\deploy-frontend.ps1
#   .\terraform\scripts\deploy-frontend.ps1 -DistDir C:\path\to\dist
#
# Cache strategy:
#   assets/*    -> immutable for 1 year (Vite puts a content hash in every file name)
#   index.html  -> browsers always revalidate; CloudFront keeps it 5 min (invalidated below)
#   other files -> 1 day (logos, favicon, images without a hash)
param(
  [string]$DistDir = (Join-Path $PSScriptRoot '..\..\frontend-ecommerce\dist'),
  [string]$Region = 'us-east-1'
)
$ErrorActionPreference = 'Stop'

$DistDir = (Resolve-Path $DistDir).Path
if (-not (Test-Path (Join-Path $DistDir 'index.html'))) {
  throw "index.html not found in $DistDir. Run 'npm run build' in frontend-ecommerce first."
}

$terraformDir = Resolve-Path (Join-Path $PSScriptRoot '..')
Push-Location $terraformDir
try {
  $bucket = terraform output -raw frontend_bucket_name
  $cloudFrontDomain = terraform output -raw frontend_cloudfront_domain_name
} finally {
  Pop-Location
}
$target = "s3://$bucket"

function Invoke-Aws {
  & aws @args
  if ($LASTEXITCODE -ne 0) { throw "aws $($args -join ' ') failed with exit code $LASTEXITCODE" }
}

Write-Host "==> Uploading $DistDir to $target" -ForegroundColor Cyan

# `cp --recursive` instead of `sync`: sync skips files whose size/date didn't change, and those
# would keep whatever Cache-Control (or none) they were first uploaded with.
Invoke-Aws s3 cp (Join-Path $DistDir 'assets') "$target/assets" --recursive `
  --cache-control 'public, max-age=31536000, immutable' --region $Region --only-show-errors

Invoke-Aws s3 cp $DistDir $target --recursive --exclude 'assets/*' --exclude 'index.html' `
  --cache-control 'public, max-age=86400' --region $Region --only-show-errors

# Uploaded last so it never references assets that aren't in the bucket yet.
Invoke-Aws s3 cp (Join-Path $DistDir 'index.html') "$target/index.html" `
  --cache-control 'public, max-age=0, s-maxage=300, must-revalidate' `
  --content-type 'text/html; charset=utf-8' --region $Region

# Removes files that are no longer in the build (everything else is already up to date).
Invoke-Aws s3 sync $DistDir $target --delete --region $Region

Write-Host "==> Invalidating CloudFront ($cloudFrontDomain)" -ForegroundColor Cyan
$distributionId = aws cloudfront list-distributions `
  --query "DistributionList.Items[?DomainName=='$cloudFrontDomain'].Id | [0]" --output text
$invalidationId = aws cloudfront create-invalidation --distribution-id $distributionId `
  --paths '/*' --query 'Invalidation.Id' --output text
Invoke-Aws cloudfront wait invalidation-completed --distribution-id $distributionId --id $invalidationId

Write-Host "Done. Frontend deployed with cache headers." -ForegroundColor Green
