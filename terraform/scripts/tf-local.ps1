#Requires -Version 5.1
# Convenience wrapper to run Terraform against LocalStack with the local.tfvars
# defaults. Usage:
#   .\terraform\scripts\tf-local.ps1 plan
#   .\terraform\scripts\tf-local.ps1 apply
#   .\terraform\scripts\tf-local.ps1 destroy
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('init', 'plan', 'apply', 'destroy')]
  [string]$Command
)

$ErrorActionPreference = 'Stop'
$terraformDir = Resolve-Path (Join-Path $PSScriptRoot '..')

Push-Location $terraformDir
try {
  terraform init -upgrade

  switch ($Command) {
    'init' { return }
    'plan' { terraform plan -var-file=environments/local.tfvars }
    'apply' { terraform apply -var-file=environments/local.tfvars -auto-approve }
    'destroy' { terraform destroy -var-file=environments/local.tfvars -auto-approve }
  }
} finally {
  Pop-Location
}
