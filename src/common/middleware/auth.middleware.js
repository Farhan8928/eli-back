const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config/env");
const { AppError } = require("../errors/AppError");
const {
  UserRepository,
} = require("../../modules/users/repositories/user.repository");

const userRepository = new UserRepository();

const authGuard = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await userRepository.findById(decoded.sub);

    if (!user) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name,
      kycStatus: user.kycStatus,
    };

    return next();
  } catch (_error) {
    return next(new AppError("Invalid or expired token", 401, "TOKEN_INVALID"));
  }
};

module.exports = { authGuard };
