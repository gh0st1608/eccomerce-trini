#!/usr/bin/env bash
# Starts only the LocalStack container from the repo's existing docker-compose
# file (profile "localstack"), so Terraform has something to talk to on
# http://localhost:4566.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

(cd "$root" && docker compose -f docker-compose.gateway.yml --profile localstack up -d localstack)

echo "LocalStack is starting on http://localhost:4566 (health: /_localstack/health)"
