import multer from "multer";
import { AppError } from "./AppError.js";
import { logger } from "../../config/logger.js";

const errorHandler = (err, req, res, _next) => {
  let normalizedError = err;

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      normalizedError = new AppError(
        "File must be 4MB or smaller",
        400,
        "FILE_TOO_LARGE",
      );
    } else {
      normalizedError = new AppError(err.message, 400, "UPLOAD_ERROR");
    }
  }

  if (!(normalizedError instanceof AppError)) {
    normalizedError = new AppError(
      normalizedError.message || "Unexpected error",
      normalizedError.statusCode || 500,
      normalizedError.code || "INTERNAL_SERVER_ERROR",
    );
  }

  if (process.env.NODE_ENV !== "production") {
    logger.error(
      {
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
      },
      "Unhandled error",
    );
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
