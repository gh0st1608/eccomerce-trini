import { BaseError } from '../../domain/exceptions/BaseError.js';
import { HTTP_STATUS } from '../../shared/constants/http-status.js';
import { errorResponse } from '../../shared/utils/response.js';

export const errorMiddleware = (err, req, res, _next) => {
  const traceId = req.context?.traceId ?? 'no-trace';

  if (err instanceof Error && err.message === 'Not allowed by CORS') {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      errorResponse({
        code: 'FORBIDDEN',
        message: 'Origin not allowed',
        traceId,
      }),
    );
  }

  if (err instanceof BaseError) {
    return res
      .status(err.statusCode)
      .json(errorResponse({ code: err.code, message: err.message, traceId }));
  }

  if (err?.type === 'entity.too.large' || err?.status === HTTP_STATUS.PAYLOAD_TOO_LARGE) {
    return res.status(HTTP_STATUS.PAYLOAD_TOO_LARGE).json(
      errorResponse({
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body too large',
        traceId,
      }),
    );
  }

  req.log?.error({ err }, 'Unhandled error');
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    errorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected error',
      traceId,
    }),
  );
};
