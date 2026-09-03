import { Router } from 'express';
import { successResponse } from '../../shared/utils/response.js';

export const createHealthRouter = () => {
  const router = Router();

  const handler = (req, res) =>
    res.json(
      successResponse({
        data: { status: 'ok' },
        message: 'healthy',
        traceId: req.context.traceId,
      }),
    );

  router.get('/health', handler);
  router.get('/ready', handler);
  router.get('/live', handler);
  return router;
};
