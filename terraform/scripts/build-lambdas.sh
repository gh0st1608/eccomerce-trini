#!/usr/bin/env bash
# Builds the Lambda deployment zip for both backends (npm prune + tar), so
# Terraform has dist/lambda.zip to reference. Run this before `terraform apply`.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

for service in ecommerce admin; do
  echo "==> Building Lambda package for $service"
  (cd "$root/$service" && npm ci && npm run build)
done

echo "Done. dist/lambda.zip is ready in ecommerce/ and admin/."
