const buildAbsoluteUrl = (baseUrl, path) => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalizedPath, normalizedBase).toString();
};

// Ecommerce no longer keeps its own store dataset; admin is the single source of truth for stores.
export class HttpAdminStoreRepository {
  constructor({ baseUrl, token, timeoutMs = 4000 } = {}) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.timeoutMs = Number.isFinite(timeoutMs) ? timeoutMs : 4000;
  }

  async findById(id) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(buildAbsoluteUrl(this.baseUrl, `/stores/pickup/${id}`), {
        headers: { authorization: `Bearer ${this.token}` },
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      return payload?.data?.store ?? null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
