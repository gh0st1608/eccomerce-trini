const buildAbsoluteUrl = (baseUrl, path) => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalizedPath, normalizedBase).toString();
};

// Ecommerce no longer owns the catalog; it only needs enough product data to build the checkout.
export class HttpAdminProductRepository {
  constructor({ baseUrl, token, timeoutMs = 4000 } = {}) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.timeoutMs = Number.isFinite(timeoutMs) ? timeoutMs : 4000;
  }

  async findById(id) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(buildAbsoluteUrl(this.baseUrl, `/products/${id}`), {
        headers: { authorization: `Bearer ${this.token}` },
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      return payload?.data?.product ?? null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async registerCheckoutItems(items = []) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      await fetch(buildAbsoluteUrl(this.baseUrl, '/products/register-checkout'), {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ items }),
        signal: controller.signal,
      });
    } catch {
      // Best-effort: featured ranking is not critical to checkout success.
    } finally {
      clearTimeout(timeout);
    }
  }
}
