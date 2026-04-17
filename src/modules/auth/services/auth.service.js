const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("../../../config/env");
const { UserRepository } = require("../../users/repositories/user.repository");
const { AppError } = require("../../../common/errors/AppError");

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  signToken(user) {
    return jwt.sign(
      {
        sub: user._id,
        role: user.role,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn },
    );
  }

  async register(payload) {
    const existing = await this.userRepository.findByEmail(payload.email);
    if (existing) {
      throw new AppError("Email already in use", 409, "EMAIL_CONFLICT");
    }

    const hash = await bcrypt.hash(payload.password, 12);
    const user = await this.userRepository.create({
      name: payload.name,
      email: payload.email,
      password: hash,
      role: "client",
      kycStatus: "pending",
    });

    const token = this.signToken(user);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
      },
    };
  }

  async login(payload) {
    const user = await this.userRepository.findByEmail(payload.email);
    if (!user) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const matched = await bcrypt.compare(payload.password, user.password);
    if (!matched) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const token = this.signToken(user);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
      },
    };
  }
}

module.exports = { AuthService };
