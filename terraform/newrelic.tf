# =============================================================================
# NEW RELIC
# =============================================================================
# Created only when a User API key is provided, so LocalStack/local runs don't
# need New Relic credentials.

locals {
  create_new_relic = var.new_relic_api_key != "" ? 1 : 0
}

# Browser (RUM) app for the storefront. The SPA loader also measures React Router
# navigations; distributed tracing links browser AJAX calls to the checkout/admin
# APM traces. Its ingest key (NRJS-...) is public: it ships inside the frontend bundle.
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
