# =============================================================================
# NEW RELIC - DASHBOARD
# =============================================================================
# Single dashboard for the storefront: real-user experience (Browser), backend health,
# SLA/SLO compliance (replaces APM-agent-only SLA reports, unavailable for OpenTelemetry
# services) and security/business signals.

locals {
  browser_app_name = "mayocollections-storefront-${var.service_name_suffix}"
  dashboard_spans  = "span.kind = 'server' AND service.name IN (${local.new_relic_service_names_nrql})"
  dashboard_svcs   = "service.name IN (${local.new_relic_service_names_nrql})"
}

resource "newrelic_one_dashboard" "storefront" {
  count = local.create_new_relic

  name        = "Trini storefront (${var.service_name_suffix})"
  permissions = "public_read_only"

  # ---------------------------------------------------------------------------
  page {
    name = "Storefront (usuarios reales)"

    widget_billboard {
      title  = "Page views"
      row    = 1
      column = 1
      width  = 3
      height = 3
      nrql_query {
        query = "SELECT count(*) AS 'Page views' FROM PageView WHERE appName = '${local.browser_app_name}' SINCE 1 day ago COMPARE WITH 1 day ago"
      }
    }

    widget_billboard {
      title  = "LCP p75 (s)"
      row    = 1
      column = 4
      width  = 3
      height = 3
      nrql_query {
        query = "SELECT percentile(largestContentfulPaint, 75) AS 'LCP p75' FROM PageViewTiming WHERE appName = '${local.browser_app_name}' SINCE 1 day ago"
      }
    }

    widget_billboard {
      title  = "Carga de página p75 (s)"
      row    = 1
      column = 7
      width  = 3
      height = 3
      nrql_query {
        query = "SELECT percentile(duration, 75) AS 'Page load p75' FROM PageView WHERE appName = '${local.browser_app_name}' SINCE 1 day ago"
      }
    }

    widget_billboard {
      title  = "Errores JavaScript"
      row    = 1
      column = 10
      width  = 3
      height = 3
      nrql_query {
        query = "SELECT count(*) AS 'JS errors' FROM JavaScriptError WHERE appName = '${local.browser_app_name}' SINCE 1 day ago"
      }
    }

    widget_line {
      title  = "Carga de página p75 (s) por hora"
      row    = 4
      column = 1
      width  = 6
      height = 3
      nrql_query {
        query = "SELECT percentile(duration, 75) FROM PageView WHERE appName = '${local.browser_app_name}' TIMESERIES 1 hour SINCE 1 week ago"
      }
    }

    widget_table {
      title  = "Llamadas al API desde el navegador"
      row    = 4
      column = 7
      width  = 6
      height = 3
      nrql_query {
        query = "SELECT count(*), percentile(timeToLoadEventStart, 50, 95) FROM AjaxRequest WHERE appName = '${local.browser_app_name}' FACET groupedRequestUrl SINCE 1 day ago LIMIT 20"
      }
    }
  }

  # ---------------------------------------------------------------------------
  page {
    name = "Backends"

    widget_line {
      title  = "Requests por servicio"
      row    = 1
      column = 1
      width  = 6
      height = 3
      nrql_query {
        query = "SELECT count(*) FROM Span WHERE ${local.dashboard_spans} FACET service.name TIMESERIES SINCE 1 day ago"
      }
    }

    widget_line {
      title  = "Latencia p95 (ms) por servicio"
      row    = 1
      column = 7
      width  = 6
      height = 3
      nrql_query {
        query = "SELECT percentile(duration.ms, 95) FROM Span WHERE ${local.dashboard_spans} FACET service.name TIMESERIES SINCE 1 day ago"
      }
    }

    widget_table {
      title  = "Endpoints: volumen, latencia y errores"
      row    = 4
      column = 1
      width  = 8
      height = 4
      nrql_query {
        query = "SELECT count(*) AS 'Requests', percentile(duration.ms, 95) AS 'p95 ms', filter(count(*), WHERE otel.status_code = 'ERROR') AS '5xx', filter(count(*), WHERE error.expected IS TRUE) AS '4xx esperados' FROM Span WHERE ${local.dashboard_spans} FACET service.name, name SINCE 1 day ago LIMIT 30"
      }
    }

    widget_bar {
      title  = "DynamoDB: operaciones por tabla"
      row    = 4
      column = 9
      width  = 4
      height = 4
      nrql_query {
        query = "SELECT count(*) FROM Span WHERE ${local.dashboard_svcs} AND db.collection.name IS NOT NULL FACET db.operation, db.collection.name SINCE 1 day ago"
      }
    }
  }

  # ---------------------------------------------------------------------------
  page {
    name = "SLA / SLO"

    widget_billboard {
      title  = "Disponibilidad 28 días (objetivo ${var.slo_availability_target}%)"
      row    = 1
      column = 1
      width  = 6
      height = 3
      nrql_query {
        query = "SELECT 100 - percentage(count(*), WHERE otel.status_code = 'ERROR') AS 'Disponibilidad %' FROM Span WHERE ${local.dashboard_spans} FACET service.name SINCE 28 days ago"
      }
    }

    widget_billboard {
      title  = "Requests < ${var.slo_latency_threshold_ms} ms, 28 días (objetivo ${var.slo_latency_target}%)"
      row    = 1
      column = 7
      width  = 6
      height = 3
      nrql_query {
        query = "SELECT percentage(count(*), WHERE duration.ms < ${var.slo_latency_threshold_ms}) AS 'Latencia OK %' FROM Span WHERE ${local.dashboard_spans} FACET service.name SINCE 28 days ago"
      }
    }

    widget_line {
      title  = "Disponibilidad diaria %"
      row    = 4
      column = 1
      width  = 12
      height = 3
      nrql_query {
        query = "SELECT 100 - percentage(count(*), WHERE otel.status_code = 'ERROR') FROM Span WHERE ${local.dashboard_spans} FACET service.name TIMESERIES 1 day SINCE 28 days ago"
      }
    }
  }

  # ---------------------------------------------------------------------------
  page {
    name = "Seguridad y negocio"

    widget_line {
      title  = "Eventos de seguridad"
      row    = 1
      column = 1
      width  = 6
      height = 3
      nrql_query {
        query = "SELECT sum(trini.security.events) FROM Metric WHERE ${local.dashboard_svcs} FACET event.category, event.action TIMESERIES SINCE 1 day ago"
      }
    }

    widget_billboard {
      title  = "Órdenes y checkouts (7 días)"
      row    = 1
      column = 7
      width  = 6
      height = 3
      nrql_query {
        query = "SELECT sum(trini.orders.created) AS 'Órdenes', sum(trini.checkouts.created) AS 'Checkouts WhatsApp' FROM Metric WHERE ${local.dashboard_svcs} SINCE 7 days ago"
      }
    }

    widget_table {
      title  = "Últimos eventos de seguridad"
      row    = 4
      column = 1
      width  = 12
      height = 4
      nrql_query {
        query = "SELECT timestamp, service.name, message, event.reason, http.route, client.ip FROM Log WHERE ${local.dashboard_svcs} AND message LIKE 'Security event%' SINCE 1 day ago LIMIT 50"
      }
    }
  }
}

output "new_relic_dashboard_url" {
  value = length(newrelic_one_dashboard.storefront) > 0 ? newrelic_one_dashboard.storefront[0].permalink : null
}
