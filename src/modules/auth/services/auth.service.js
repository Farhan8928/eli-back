import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  jwtSecret,
  jwtExpiresIn,
  impersonationTokenExpiresIn,
  impersonationCodeTtlSeconds,
} from "../../../config/env.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { AppError } from "../../../common/errors/AppError.js";

import { mailService } from "../../admin/services/mail.service.js";
import { AuditLog } from "../../admin/models/auditLog.model.js";
import { ImpersonationCode } from "../models/impersonationCode.model.js";

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  signToken(user, extraClaims = {}, options = {}) {
    return jwt.sign(
      {
        sub: user._id,
        role: user.role,
        email: user.email,
        ...extraClaims,
      },
      jwtSecret,
      { expiresIn: options.expiresIn || jwtExpiresIn },
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

  /**
   * Step 1 of admin impersonation: issue a single-use handoff code that the
   * new browser tab will exchange for a real JWT. We never put the JWT itself
   * in the URL.
   */
  async issueImpersonationCode(targetUserId, adminContext, requestMeta = {}) {
    const target = await this.userRepository.findById(targetUserId);
    if (!target) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    if (String(target._id) === String(adminContext.id)) {
      throw new AppError(
        "Cannot impersonate yourself",
        400,
        "IMPERSONATION_SELF_FORBIDDEN",
      );
    }
    if (target.role === "superadmin") {
      throw new AppError(
        "Cannot impersonate another administrator",
        403,
        "IMPERSONATION_FORBIDDEN",
      );
    }

    const code = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + impersonationCodeTtlSeconds * 1000);

    await ImpersonationCode.create({
      code,
      targetUserId: target._id,
      adminId: adminContext.id,
      adminEmail: adminContext.email,
      issuedFromIp: requestMeta.ip,
      expiresAt,
    });

    return {
      code,
      expiresAt: expiresAt.toISOString(),
      ttlSeconds: impersonationCodeTtlSeconds,
    };
  }

  /**
   * Step 2 of admin impersonation: atomically consume the handoff code and
   * return a JWT scoped to the target user, carrying an `act` claim that
   * records which administrator is behind the session.
   */
  async exchangeImpersonationCode(code, requestMeta = {}) {
    if (!code || typeof code !== "string") {
      throw new AppError(
        "Invalid impersonation code",
        400,
        "IMPERSONATION_CODE_INVALID",
      );
    }

    // Atomic single-use consume; even simultaneous requests can only succeed once.
    const record = await ImpersonationCode.findOneAndDelete({ code });
    if (!record) {
      throw new AppError(
        "Impersonation code is invalid or has already been used",
        400,
        "IMPERSONATION_CODE_INVALID",
      );
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new AppError(
        "Impersonation code has expired",
        400,
        "IMPERSONATION_CODE_EXPIRED",
      );
    }

    const user = await this.userRepository.findById(record.targetUserId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const token = this.signToken(
      user,
      {
        act: {
          sub: String(record.adminId),
          email: record.adminEmail,
          role: "superadmin",
        },
      },
      { expiresIn: impersonationTokenExpiresIn },
    );

    await AuditLog.create({
      userId: record.adminId,
      userEmail: record.adminEmail,
      userType: "admin",
      log: `Admin impersonated user: ${user.email}`,
      ipAddress: requestMeta.ip,
      metadata: {
        targetUserId: user._id,
        targetUserEmail: user.email,
      },
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
      impersonatedBy: {
        id: String(record.adminId),
        email: record.adminEmail,
      },
    };
  }
}

export { AuthService };
