// API responses are private and uncacheable unless a route opts in (see publicReadAuthMiddleware).
// Without an explicit header, CloudFront/browsers could apply heuristic caching.
export const noStoreByDefaultMiddleware = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};
