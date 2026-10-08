# =============================================================================
# NEW RELIC
# =============================================================================
# Created only when a User API key is provided, so LocalStack/local runs don't
# need New Relic credentials.

locals {
  # Only *whether* a key is set is derived here (never the key itself), so unwrapping the
  # sensitivity is safe and lets for_each/count use it.
  create_new_relic = nonsensitive(var.new_relic_api_key != "") ? 1 : 0

  # OpenTelemetry services (as named by OTEL_SERVICE_NAME in lambda.tf).
  new_relic_services = local.create_new_relic == 1 ? {
    admin    = local.admin_service_name
    checkout = local.checkout_service_name
  } : {}
  new_relic_service_names_nrql = join(", ", [for name in values(local.new_relic_services) : "'${name}'"])
}

# Browser (RUM) app for the storefront. The SPA loader also measures React Router
# navigations; distributed tracing links browser AJAX calls to the checkout/admin
# APM traces. Its ingest key (NRBR-...) is public: it ships inside the frontend bundle.
resource "newrelic_browser_application" "storefront" {
  count = local.create_new_relic

  name                        = "mayocollections-storefront-${var.service_name_suffix}"
  loader_type                 = "SPA"
  distributed_tracing_enabled = true
  cookies_enabled             = true
}

# js_config is marked sensitive by the provider, but the Browser loader settings are public by
# design (the browser agent ships them to every visitor), so they are unwrapped explicitly.
locals {
  browser_loader_config = length(newrelic_browser_application.storefront) > 0 ? nonsensitive(jsondecode(newrelic_browser_application.storefront[0].js_config).loader_config) : null
}

# Guard: in prod a missing User API key must fail the plan instead of planning to destroy
# every New Relic resource (Browser app, SLOs, alerts, dashboard) managed here.
resource "terraform_data" "new_relic_prod_guard" {
  lifecycle {
    precondition {
      condition     = var.environment != "prod" || local.create_new_relic == 1
      error_message = "new_relic_api_key is required when environment = \"prod\" (otherwise New Relic resources would be destroyed)."
    }
  }
}
