# =============================================================================
# NEW RELIC - ALERTS
# =============================================================================
# Thresholds are tuned for a low-traffic store: conditions count events over a window
# instead of using percentages, so a single failed request out of two doesn't page anyone.
# No "loss of signal" condition: with CloudFront caching the catalog, hours without Lambda
# invocations are normal and would raise false alarms.

resource "newrelic_alert_policy" "backends" {
  count = local.create_new_relic

  name                = "trini-${var.service_name_suffix}"
  incident_preference = "PER_CONDITION_AND_TARGET"
}

locals {
  alert_server_spans = "span.kind = 'server' AND service.name IN (${local.new_relic_service_names_nrql})"
}

# Real faults: 5xx/unexpected errors (expected 4xx are not ERROR spans).
resource "newrelic_nrql_alert_condition" "server_errors" {
  count = local.create_new_relic

  policy_id   = newrelic_alert_policy.backends[0].id
  type        = "static"
  name        = "Backend 5xx errors"
  description = "More than 3 requests failed with a 5xx/unexpected error within 5 minutes. Check Errors inbox and the failing traces."
  enabled     = true

  nrql {
    query = "SELECT count(*) FROM Span WHERE ${local.alert_server_spans} AND otel.status_code = 'ERROR' FACET service.name"
  }

  critical {
    operator              = "above"
    threshold             = 3
    threshold_duration    = 300
    threshold_occurrences = "at_least_once"
  }

  aggregation_window           = 300
  aggregation_method           = "event_flow"
  aggregation_delay            = 120
  fill_option                  = "none"
  violation_time_limit_seconds = 86400
}

# Sustained slowness (a single cold start is ~1.5-1.7s, so 3s p95 for 10 min is a real problem).
resource "newrelic_nrql_alert_condition" "latency_p95" {
  count = local.create_new_relic

  policy_id   = newrelic_alert_policy.backends[0].id
  type        = "static"
  name        = "Backend p95 latency"
  description = "p95 of API requests above 3 s for 10 minutes. Check slow traces (DynamoDB, admin calls, cold starts)."
  enabled     = true

  nrql {
    query = "SELECT percentile(duration.ms, 95) FROM Span WHERE ${local.alert_server_spans} FACET service.name"
  }

  critical {
    operator              = "above"
    threshold             = 3000
    threshold_duration    = 600
    threshold_occurrences = "all"
  }

  aggregation_window           = 300
  aggregation_method           = "event_flow"
  aggregation_delay            = 120
  fill_option                  = "none"
  violation_time_limit_seconds = 86400
}

# Possible brute force / token scanning: many authentication rejections in a short window.
resource "newrelic_nrql_alert_condition" "auth_failures" {
  count = local.create_new_relic

  policy_id   = newrelic_alert_policy.backends[0].id
  type        = "static"
  name        = "Authentication failures spike"
  description = "More than 20 rejected tokens/logins within 5 minutes. Review 'Security event' logs (client.ip, event.reason)."
  enabled     = true

  nrql {
    query = "SELECT sum(trini.security.events) FROM Metric WHERE event.category = 'authentication' AND service.name IN (${local.new_relic_service_names_nrql}) FACET service.name"
  }

  critical {
    operator              = "above"
    threshold             = 20
    threshold_duration    = 300
    threshold_occurrences = "at_least_once"
  }

  aggregation_window           = 300
  aggregation_method           = "event_flow"
  aggregation_delay            = 120
  fill_option                  = "none"
  violation_time_limit_seconds = 86400
}

# The process crashed on an unhandled rejection/exception (see process-error-handlers.js).
resource "newrelic_nrql_alert_condition" "process_crash" {
  count = local.create_new_relic

  policy_id   = newrelic_alert_policy.backends[0].id
  type        = "static"
  name        = "Unhandled process error"
  description = "A Lambda instance crashed on an unhandled rejection/exception. The span has the stack trace."
  enabled     = true

  nrql {
    query = "SELECT count(*) FROM Span WHERE name IN ('process.unhandledRejection', 'process.uncaughtException') AND service.name IN (${local.new_relic_service_names_nrql}) FACET service.name"
  }

  critical {
    operator              = "above"
    threshold             = 0
    threshold_duration    = 60
    threshold_occurrences = "at_least_once"
  }

  aggregation_window           = 60
  aggregation_method           = "event_flow"
  aggregation_delay            = 120
  fill_option                  = "none"
  violation_time_limit_seconds = 86400
}

# Availability SLO burning its 28-day error budget too fast (New Relic's recommended
# fast-burn settings: ~2% of the budget consumed within an hour).
data "newrelic_service_level_alert_helper" "availability_fast_burn" {
  for_each = local.new_relic_services

  alert_type    = "fast_burn"
  sli_guid      = newrelic_service_level.availability[each.key].sli_guid
  slo_target    = var.slo_availability_target
  slo_period    = 28
  is_bad_events = true
}

resource "newrelic_nrql_alert_condition" "availability_fast_burn" {
  for_each = local.new_relic_services

  policy_id   = newrelic_alert_policy.backends[0].id
  type        = "static"
  name        = "${each.value} availability SLO fast burn"
  description = "The availability SLO error budget is being consumed too fast."
  enabled     = true

  nrql {
    query = data.newrelic_service_level_alert_helper.availability_fast_burn[each.key].nrql
  }

  critical {
    operator              = "above_or_equals"
    threshold             = data.newrelic_service_level_alert_helper.availability_fast_burn[each.key].threshold
    threshold_duration    = 900
    threshold_occurrences = "at_least_once"
  }

  aggregation_window           = data.newrelic_service_level_alert_helper.availability_fast_burn[each.key].evaluation_period
  slide_by                     = 900
  aggregation_method           = "event_flow"
  aggregation_delay            = 120
  fill_option                  = "none"
  violation_time_limit_seconds = 86400
}

# -----------------------------------------------------------------------------
# Notifications (email). Skipped when alert_notification_emails is empty.
# -----------------------------------------------------------------------------
locals {
  create_alert_notifications = local.create_new_relic == 1 && length(var.alert_notification_emails) > 0 ? 1 : 0
}

resource "newrelic_notification_destination" "email" {
  count = local.create_alert_notifications

  name = "trini-${var.service_name_suffix}-email"
  type = "EMAIL"

  property {
    key   = "email"
    value = join(",", var.alert_notification_emails)
  }
}

resource "newrelic_notification_channel" "email" {
  count = local.create_alert_notifications

  name           = "trini-${var.service_name_suffix}-email"
  type           = "EMAIL"
  product        = "IINT"
  destination_id = newrelic_notification_destination.email[0].id

  property {
    key   = "subject"
    value = "[trini-${var.service_name_suffix}] {{issueTitle}}"
  }
}

resource "newrelic_workflow" "backends" {
  count = local.create_alert_notifications

  name                  = "trini-${var.service_name_suffix}"
  muting_rules_handling = "NOTIFY_ALL_ISSUES"

  issues_filter {
    name = "trini-${var.service_name_suffix} policy"
    type = "FILTER"

    predicate {
      attribute = "labels.policyIds"
      operator  = "EXACTLY_MATCHES"
      values    = [newrelic_alert_policy.backends[0].id]
    }
  }

  destination {
    channel_id = newrelic_notification_channel.email[0].id
  }
}
