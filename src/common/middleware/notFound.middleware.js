const { AppError } = require("../errors/AppError");

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404, "NOT_FOUND"));
};

module.exports = { notFound };