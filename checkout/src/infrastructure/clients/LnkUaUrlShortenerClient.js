const SHORT_URL_KEYS = [
  'shortUrl',
  'short_url',
  'shortLink',
  'short_link',
  'lnk',
  'url',
  'link',
  'result',
  'data',
];

const buildAbsoluteUrl = (baseUrl, pathOrUrl) => {
  if (!pathOrUrl) {
    return baseUrl;
  }

  try {
    return new URL(pathOrUrl).toString();
  } catch {
    return new URL(pathOrUrl, baseUrl).toString();
  }
};

const isValidUrl = (value) => {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const extractShortUrl = (payload) => {
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return isValidUrl(trimmed) ? trimmed : null;
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  for (const key of SHORT_URL_KEYS) {
    if (!(key in payload)) {
      continue;
    }

    const found = extractShortUrl(payload[key]);
    if (found) {
      return found;
    }
  }

  return null;
};

export class LnkUaUrlShortenerClient {
  constructor({
    baseUrl = 'https://lnk.ua',
    shortenPath = '/api/v1/link/create',
    bearerToken = '',
    timeoutMs = 3500,
  } = {}) {
    this.shortenUrl = buildAbsoluteUrl(baseUrl, shortenPath);
    this.bearerToken = bearerToken;
    this.timeoutMs = Number.isFinite(timeoutMs) ? timeoutMs : 3500;
  }

  async shorten(url) {
    if (!isValidUrl(url)) {
      return url;
    }

    if (!this.bearerToken) {
      return url;
    }

    const shortUrl = await this.#executeAttempt({
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ link: url }).toString(),
    });

    return shortUrl ?? url;
  }

  async #executeAttempt(attempt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(attempt.url ?? this.shortenUrl, {
        method: attempt.method,
        headers: {
          authorization: `Bearer ${this.bearerToken}`,
          ...attempt.headers,
        },
        body: attempt.body,
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const payload = await response.json();
        return extractShortUrl(payload);
      }

      const payload = await response.text();
      return extractShortUrl(payload);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
