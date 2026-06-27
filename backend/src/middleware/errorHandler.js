function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    error: {
      message: statusCode === 500 ? 'Internal server error' : error.message,
    },
  });
}

module.exports = { errorHandler };
