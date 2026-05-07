import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { jwtSecret, jwtExpiresIn } from "../../../config/env.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { AppError } from "../../../common/errors/AppError.js";

import { mailService } from "../../admin/services/mail.service.js";
import { AuditLog } from "../../admin/models/auditLog.model.js";

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
      if (existing.isEmailVerified) {
        throw new AppError("Email already in use", 409, "EMAIL_CONFLICT");
      }

      existing.name = payload.name;
      existing.password = await bcrypt.hash(payload.password, 12);
      existing.isEmailVerified = true;
      existing.otp = null;
      existing.otpExpiresAt = null;
      await existing.save();

      await AuditLog.create({
        userType: "system",
        log: `Incomplete registration completed: ${existing.email}`,
        metadata: { userId: existing._id },
      });

      return {
        message: "Account ready. Please sign in.",
        email: existing.email,
      };
    }

    const hash = await bcrypt.hash(payload.password, 12);
    const user = await this.userRepository.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hash,
      role: "client",
      kycStatus: "pending",
      isEmailVerified: true,
      otp: null,
      otpExpiresAt: null,
    });

    await AuditLog.create({
      userType: "system",
      log: `New user registered: ${user.email}`,
      metadata: { userId: user._id },
    });

    return {
      message: "Account created. Please sign in.",
      email: user.email,
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

    await AuditLog.create({
      userType: user.role,
      log: `${user.role} logged in: ${user.email}`,
      metadata: { userId: user._id },
    });

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

  async forgotPassword(payload) {
    const user = await this.userRepository.findByEmail(payload.email);
    const successMsg =
      "If an account exists with this email, a reset password has been sent.";

    if (!user) {
      return { message: successMsg };
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(tempPassword, 12);

    user.password = hash;
    await user.save();

    await mailService.sendTemplatedEmail("FORGOT_PASSWORD", user.email, {
      NAME: user.name,
      PASSWORD: tempPassword,
    });

    return { message: successMsg };
  }

  /**
   * Sends CLIENT_PORTAL_WELCOME once per client after they reach the dashboard.
   */
  async sendPortalWelcomeIfNeeded(userContext) {
    const user = await this.userRepository.findById(userContext.id);
    if (!user || user.role !== "client") {
      return { sent: false };
    }
    if (user.portalWelcomeEmailSentAt) {
      return { sent: false };
    }

    const ok = await mailService.sendTemplatedEmail(
      "CLIENT_PORTAL_WELCOME",
      user.email,
      {
        NAME: String(user.name || ""),
        EMAIL: String(user.email || ""),
      },
    );

    user.portalWelcomeEmailSentAt = new Date();
    await user.save();

    return { sent: ok };
  }

  async impersonateUser(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const token = this.signToken(user);

    await AuditLog.create({
      userType: "admin",
      log: `Admin impersonated user: ${user.email}`,
      metadata: { userId: user._id },
    });

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

export { AuthService };
