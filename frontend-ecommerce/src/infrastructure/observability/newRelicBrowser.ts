import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent'
import { env } from '@infrastructure/config/env'

let started = false

function toOrigin(baseUrl: string): string | null {
  try {
    return new URL(baseUrl).origin
  } catch {
    // Relative paths (e.g. '/api/v1/admin') are always same-origin, nothing to allow-list.
    return null
  }
}

/**
 * Boots New Relic Browser (RUM) with distributed tracing so storefront page
 * loads correlate with the admin/checkout APM traces in a single New Relic trace.
 * No-ops if the browser app credentials are not configured (e.g. local dev).
 */
export function initNewRelicBrowser() {
  if (started) return
  if (!env.VITE_NEW_RELIC_BROWSER_LICENSE_KEY || !env.VITE_NEW_RELIC_BROWSER_AGENT_ID) {
    return
  }

  const allowedOrigins = [env.VITE_ADMIN_API_BASE_URL, env.VITE_ECOMMERCE_API_BASE_URL]
    .map(toOrigin)
    .filter((origin): origin is string => origin !== null)

  new BrowserAgent({
    init: {
      distributed_tracing: {
        enabled: true,
        cors_use_tracecontext_headers: true,
        allowed_origins: allowedOrigins,
      },
      privacy: { cookies_enabled: true },
      ajax: { deny_list: [] },
    },
    loader_config: {
      accountID: env.VITE_NEW_RELIC_BROWSER_ACCOUNT_ID,
      trustKey: env.VITE_NEW_RELIC_BROWSER_TRUST_KEY ?? env.VITE_NEW_RELIC_BROWSER_ACCOUNT_ID,
      agentID: env.VITE_NEW_RELIC_BROWSER_AGENT_ID,
      licenseKey: env.VITE_NEW_RELIC_BROWSER_LICENSE_KEY,
      applicationID: env.VITE_NEW_RELIC_BROWSER_AGENT_ID,
    },
    info: {
      beacon: 'bam.nr-data.net',
      errorBeacon: 'bam.nr-data.net',
      licenseKey: env.VITE_NEW_RELIC_BROWSER_LICENSE_KEY,
      applicationID: env.VITE_NEW_RELIC_BROWSER_AGENT_ID,
      sa: 1,
    },
  })

  started = true
}
