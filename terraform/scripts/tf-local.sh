#!/usr/bin/env bash
# Convenience wrapper to run Terraform against LocalStack with the local.tfvars
# defaults. Usage:
#   ./terraform/scripts/tf-local.sh plan
#   ./terraform/scripts/tf-local.sh apply
#   ./terraform/scripts/tf-local.sh destroy
set -euo pipefail

command="${1:-plan}"
terraform_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$terraform_dir"
terraform init -upgrade

case "$command" in
  init) ;;
  plan) terraform plan -var-file=environments/local.tfvars ;;
  apply) terraform apply -var-file=environments/local.tfvars -auto-approve ;;
  destroy) terraform destroy -var-file=environments/local.tfvars -auto-approve ;;
  *) echo "Unknown command: $command (use init|plan|apply|destroy)" >&2; exit 1 ;;
esac
