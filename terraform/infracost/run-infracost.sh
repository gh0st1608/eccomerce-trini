#!/usr/bin/env bash
# Runs Infracost (via Docker, no local install needed) against the Terraform
# code and prints a cost breakdown table. Also supports --format html/json.
#
# Prerequisite: set INFRACOST_API_KEY (free key from https://www.infracost.io/).
#   export INFRACOST_API_KEY="ico-xxxxxxxx"
#
# Usage:
#   ./terraform/infracost/run-infracost.sh [table|html|json]
set -euo pipefail

format="${1:-table}"

if [ -z "${INFRACOST_API_KEY:-}" ]; then
  echo "INFRACOST_API_KEY is not set. Get a free key at https://www.infracost.io/ and run: export INFRACOST_API_KEY=<key>" >&2
  exit 1
fi

terraform_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_root="$(cd "$terraform_root/.." && pwd)"

# Infracost needs `terraform plan` to succeed, which needs the Lambda zip files
# to exist on disk. Create empty placeholders when the real build hasn't run -
# pricing depends on resource attributes (memory, runtime), not zip contents.
for service in ecommerce admin; do
  dist_dir="$repo_root/$service/dist"
  zip_path="$dist_dir/lambda.zip"
  if [ ! -f "$zip_path" ]; then
    mkdir -p "$dist_dir"
    echo "placeholder" > "$zip_path"
    echo "Created placeholder $zip_path (run terraform/scripts/build-lambdas.sh for a real one)"
  fi
done

out_args=()
if [ "$format" != "table" ]; then
  out_args=(--out-file "/code/terraform/infracost/infracost-report.$format")
fi

docker run --rm \
  -e "INFRACOST_API_KEY=$INFRACOST_API_KEY" \
  -v "$repo_root:/code" \
  infracost/infracost:ci-latest \
  breakdown \
  --config-file=/code/terraform/infracost/infracost.yml \
  --format="$format" \
  "${out_args[@]}"
