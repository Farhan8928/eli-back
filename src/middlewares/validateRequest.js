const { AppError } = require("../common/errors/AppError");

const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body || {},
    params: req.params || {},
    query: req.query || {}
  });

  if (!result.success) {
    return next(
      new AppError(
        "Validation error",
        400,
        "VALIDATION_ERROR",
        result.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message
        }))
      )
    );
  }

  req.validated = result.data;
  req.body = result.data.body;
  req.params = result.data.params;
  req.query = result.data.query;

  return next();
};

module.exports = { validateRequest };