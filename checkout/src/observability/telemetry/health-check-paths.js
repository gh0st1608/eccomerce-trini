const HEALTH_CHECK_PATHS = new Set(['/health', '/ready', '/live']);

export const isHealthCheckPath = (url = '') => HEALTH_CHECK_PATHS.has(url.split('?')[0]);
