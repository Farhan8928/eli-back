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
      
      // If user exists but not verified, update and resend OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      existing.otp = otp;
      existing.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      existing.name = payload.name; // Allow updating name
      existing.password = await bcrypt.hash(payload.password, 12); // Allow updating password
      await existing.save();

      await mailService.sendTemplatedEmail("WELCOME_EMAIL", existing.email, {
        NAME: existing.name,
        EMAIL: existing.email,
        OTP: otp,
      });

      return {
        message: "Account exists but not verified. A new OTP has been sent.",
        email: existing.email,
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const hash = await bcrypt.hash(payload.password, 12);
    const user = await this.userRepository.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hash,
      role: "client",
      kycStatus: "pending",
      otp,
      otpExpiresAt,
    });

    await AuditLog.create({
      userType: "system",
      log: `New user registered: ${user.email}`,
      metadata: { userId: user._id }
    });

    // Send OTP Email
    await mailService.sendTemplatedEmail("WELCOME_EMAIL", user.email, {
      NAME: user.name,
      EMAIL: user.email,
      OTP: otp, // Add OTP to template data
    });

    return {
      message: "Signup successful. Please verify your email with the OTP sent.",
      email: user.email,
    };
  }

  async verifyOtp(payload) {
    const user = await this.userRepository.findByEmail(payload.email);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (user.otp !== payload.otp || user.otpExpiresAt < new Date()) {
      throw new AppError("Invalid or expired OTP", 400, "INVALID_OTP");
    }

    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    user.status = "approved"; // Automatically approve on email verification or keep pending?
    await user.save();

    await AuditLog.create({
      userType: "system",
      log: `User email verified: ${user.email}`,
      metadata: { userId: user._id }
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

    if (!user.isEmailVerified && user.role !== "superadmin") {
      throw new AppError("Please verify your email first", 403, "EMAIL_NOT_VERIFIED");
    }

    const matched = await bcrypt.compare(payload.password, user.password);
    if (!matched) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const token = this.signToken(user);

    await AuditLog.create({
      userType: user.role,
      log: `${user.role} logged in: ${user.email}`,
      metadata: { userId: user._id }
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
    const successMsg = "If an account exists with this email, a reset password has been sent.";
    
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

  async impersonateUser(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const token = this.signToken(user);

    await AuditLog.create({
      userType: "admin",
      log: `Admin impersonated user: ${user.email}`,
      metadata: { userId: user._id }
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
