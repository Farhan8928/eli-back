const { AppError } = require("../errors/AppError");

const roleGuard =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    }

    return next();
  };

module.exports = { roleGuard };
