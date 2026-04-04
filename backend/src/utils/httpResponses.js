export const successResponse = (
  res,
  data = null,
  message = 'OK',
  status = 200
) => {
  return res.status(status).json({
    success: true,
    data,
    message,
  });
};

export const errorResponse = (
  res,
  message = 'Error',
  status = 500,
  error = null
) => {
  return res.status(status).json({
    success: false,
    data: null,
    message,
    error: error || message,
  });
};

// Compatibilidad temporal con llamadas existentes.
export const sendSuccess = (res, options = {}) => {
  const {
    status = 200,
    data = null,
    message = 'Operacion exitosa',
  } = options;

  return successResponse(res, data, message, status);
};

export const sendError = (res, options = {}) => {
  const {
    status = 500,
    message = 'Error',
    error = null,
  } = options;

  return errorResponse(res, message, status, error);
};
