import { AppError } from "./AppError.js";
import { logger } from "../../config/logger.js";

const errorHandler = (err, req, res, _next) => {
  let normalizedError = err;

  if (!(err instanceof AppError)) {
    normalizedError = new AppError(
      err.message || "Unexpected error",
      err.statusCode || 500,
      err.code || "INTERNAL_SERVER_ERROR",
    );
  }

  if (process.env.NODE_ENV !== "production") {
    logger.error({ err }, "Unhandled error");
  }

  return res.status(normalizedError.statusCode).json({
    success: false,
    error: {
      code: normalizedError.code,
      message: normalizedError.message,
      details: normalizedError.details,
    },
  });
};

export { errorHandler };
