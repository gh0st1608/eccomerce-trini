import { Router } from 'express';
import { successResponse } from '../../shared/utils/response.js';

export const createHealthRouter = () => {
  const router = Router();

  const healthHandler = (req, res) =>
    res.json(
      successResponse({
        data: { status: 'ok' },
        message: 'healthy',
        traceId: req.context.traceId,
      }),
    );

  router.get('/health', healthHandler);
  router.get('/ready', healthHandler);
  router.get('/live', healthHandler);

  return router;
};
