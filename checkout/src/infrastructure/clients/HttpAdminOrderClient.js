import { OrderClientPort } from '../../application/ports/OrderClientPort.js';
import { clearTimeout, setTimeout } from 'node:timers';
import { URL } from 'node:url';

const buildAbsoluteUrl = (baseUrl, path) => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalizedPath, normalizedBase).toString();
};

export class HttpAdminOrderClient extends OrderClientPort {
  constructor({ baseUrl, token, timeoutMs = 4000 } = {}) {
    super();
    this.baseUrl = baseUrl;
    this.token = token;
    this.timeoutMs = Number.isFinite(timeoutMs) ? timeoutMs : 4000;
  }

  async create(order) {
    const controller = new globalThis.AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await globalThis.fetch(buildAbsoluteUrl(this.baseUrl, '/orders'), {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(order),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Admin order API returned HTTP ${response.status}`);
      }

      const payload = await response.json();
      return payload?.data?.order;
    } finally {
      clearTimeout(timeout);
    }
  }
}