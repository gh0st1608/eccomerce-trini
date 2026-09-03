export const successResponse = ({ 
    data = {}, 
    message = '', 
    traceId = '' 
}) => ({
  success: true,
  data,
  message,
  traceId,
});

export const errorResponse = ({
  code = 'INTERNAL_ERROR',
  message = 'Unexpected error',
  traceId = '',
}) => ({
  success: false,
  error: { code, message },
  traceId,
});
