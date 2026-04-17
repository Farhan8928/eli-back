const { AppError } = require("./AppError");

const errorHandler = (err, req, res, next) => {
  let normalizedError = err;

  if (!(err instanceof AppError)) {
    normalizedError = new AppError(
      err.message || "Unexpected error",
      err.statusCode || 500,
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return res.status(normalizedError.statusCode).json({
    success: false,
    error: {
      code: normalizedError.code,
      message: normalizedError.message,
      details: normalizedError.details
    }
  });
};

module.exports = { errorHandler };