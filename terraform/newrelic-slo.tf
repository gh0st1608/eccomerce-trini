# =============================================================================
# NEW RELIC - SERVICE LEVELS (SLI/SLO)
# =============================================================================
# One availability and one latency SLO per backend, measured on the SERVER spans the
# services export over OpenTelemetry (one per API request reaching the Lambda).
# Responses served from the CloudFront cache never reach the Lambda, so these SLOs
# describe the backends, not every storefront page load (see the Browser app for that).

data "newrelic_entity" "service" {
  for_each = local.new_relic_services

  name   = each.value
  domain = "EXT"
  type   = "SERVICE"
}

locals {
  slo_server_spans = {
    for key, name in local.new_relic_services :
    key => "service.name = '${name}' AND span.kind = 'server'"
  }
}

# Availability: requests that did not end in a 5xx/unexpected error. Expected client errors
# (4xx) are not ERROR spans (see record-span-error.js), so they don't burn the budget.
resource "newrelic_service_level" "availability" {
  for_each = local.new_relic_services

  guid        = data.newrelic_entity.service[each.key].guid
  name        = "${each.value} availability"
  description = "Share of API requests without a 5xx/unexpected error."

  events {
    account_id = tonumber(var.new_relic_account_id)
    valid_events {
      from  = "Span"
      where = local.slo_server_spans[each.key]
    }
    bad_events {
      from  = "Span"
      where = "${local.slo_server_spans[each.key]} AND otel.status_code = 'ERROR'"
    }
  }

  objective {
    target = var.slo_availability_target
    time_window {
      rolling {
        count = 28
        unit  = "DAY"
      }
    }
  }
}

# Latency: requests answered under the threshold (cold starts included).
resource "newrelic_service_level" "latency" {
  for_each = local.new_relic_services

  guid        = data.newrelic_entity.service[each.key].guid
  name        = "${each.value} latency"
  description = "Share of API requests served in under ${var.slo_latency_threshold_ms} ms."

  events {
    account_id = tonumber(var.new_relic_account_id)
    valid_events {
      from  = "Span"
      where = local.slo_server_spans[each.key]
    }
    good_events {
      from  = "Span"
      where = "${local.slo_server_spans[each.key]} AND duration.ms < ${var.slo_latency_threshold_ms}"
    }
  }

  objective {
    target = var.slo_latency_target
    time_window {
      rolling {
        count = 28
        unit  = "DAY"
      }
    }
  }
}
