const { AppError } = require("../errors/AppError");

const validate = (schema, source = "body") => (req, res, next) => {
  const payload = req[source];
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map((d) => ({
      message: d.message,
      path: d.path
    }));
    return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", details));
  }

  req[source] = value;
  return next();
};

module.exports = { validate };