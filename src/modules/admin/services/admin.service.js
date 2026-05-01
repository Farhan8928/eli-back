import { AppError } from "../../../common/errors/AppError.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { User } from "../../users/model/user.model.js";
import { Mt5Account } from "../../mt5Accounts/model/mt5Account.model.js";
import { Transaction } from "../../transactions/model/transaction.model.js";
import { Plan } from "../models/plan.model.js";
import { EmailerConfig } from "../models/emailer.model.js";
import { SmtpConfig } from "../models/smtp.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import bcrypt from "bcryptjs";
import { mailService } from "./mail.service.js";

class AdminService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async listClients(query) {
    return this.userRepository.findAllClients(query);
  }

  async updateUser(userId, payload) {
    const updated = await this.userRepository.updateById(userId, payload);
    if (!updated) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    // Email trigger for KYC update
    if (payload.kycStatus) {
      mailService.sendTemplatedEmail(
        `KYC_${payload.kycStatus.toUpperCase()}`,
        updated.email,
        {
          NAME: updated.name,
          STATUS: payload.kycStatus,
        },
      );
    }

    // Audit Log
    this.createAuditLog({
      userType: "admin",
      log: `Admin updated user profile for ${updated.email}`,
      metadata: payload,
    });

    return updated;
  }

  async changeUserPassword(userId, newPassword) {
    const hash = await bcrypt.hash(newPassword, 12);
    const updated = await this.userRepository.updateById(userId, {
      password: hash,
    });
    if (!updated) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    this.createAuditLog({
      userType: "admin",
      log: `Admin changed password for user ${updated.email}`,
      metadata: { userId },
    });

    return { success: true };
  }

  async deleteUser(userId) {
    const deleted = await this.userRepository.deleteById(userId);
    if (!deleted) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    this.createAuditLog({
      userType: "admin",
      log: `Admin deleted user account ${deleted.email}`,
      metadata: { userId },
    });

    return { id: userId, deleted: true };
  }

  async getSystemAnalytics() {
    const [
      totalClients,
      approvedKyc,
      totalMt5Accounts,
      totalDeposits,
      totalWithdrawals,
    ] = await Promise.all([
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "client", kycStatus: "approved" }),
      Mt5Account.countDocuments(),
      Transaction.aggregate([
        { $match: { type: "deposit", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "withdraw", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return {
      totalClients,
      approvedKyc,
      totalMt5Accounts,
      totalDeposits: totalDeposits[0]?.total || 0,
      totalWithdrawals: totalWithdrawals[0]?.total || 0,
    };
  }

  async getDashboardCharts() {
    // Registrations over time (last 6 months)
    const registrations = await User.aggregate([
      {
        $match: { role: "client" },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 },
    ]);

    // Format for charts: { label: 'MM-YYYY', value: N }
    const chartData = registrations.map((item) => ({
      label: `${item._id.month}-${item._id.year}`,
      value: item.count,
    }));

    // For Last 15 Commissions, we simulate some data for now as commission logic is complex
    const commissions = Array.from({ length: 15 }, (_, i) => ({
      period: `Day ${i + 1}`,
      traders: Math.floor(Math.random() * 10) + 1,
      commission: Math.floor(Math.random() * 500) + 100,
    }));

    return {
      registrations: chartData,
      commissions,
    };
  }

  async listAuditLogs(query) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 10, 10);
    const search = query.search || "";
    const skip = (page - 1) * limit;

    const filter = search
      ? {
          $or: [
            { log: { $regex: search, $options: "i" } },
            { userType: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    return { items, total };
  }

  async createAuditLog(payload) {
    return AuditLog.create(payload);
  }

  // Plans Management
  async createPlan(payload) {
    const plan = await Plan.create(payload);
    this.createAuditLog({
      userType: "admin",
      log: `Admin created new plan: ${plan.planName}`,
      metadata: payload,
    });
    return plan;
  }

  async updatePlan(planId, payload) {
    const updated = await Plan.findByIdAndUpdate(planId, payload, {
      new: true,
    });
    if (!updated) throw new AppError("Plan not found", 404, "PLAN_NOT_FOUND");
    return updated;
  }

  async deletePlan(planId) {
    const deleted = await Plan.findByIdAndDelete(planId);
    if (!deleted) throw new AppError("Plan not found", 404, "PLAN_NOT_FOUND");
    return { id: planId, deleted: true };
  }

  async listPlans(query) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 10, 10);
    const search = query.search || "";
    const skip = (page - 1) * limit;

    const filter = search
      ? {
          $or: [
            { planName: { $regex: search, $options: "i" } },
            { groupName: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    let [items, total] = await Promise.all([
      Plan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Plan.countDocuments(filter),
    ]);

    // Auto-seed default plans if empty and no search is active
    if (total === 0 && !search && page === 1) {
      const defaultPlans = [
        {
          planName: "Elite Standard",
          groupName: "Real\\EliteFX_Standard",
          leverage: "1:100",
          minDeposit: 100,
          active: true,
        },
        {
          planName: "Elite ECN",
          groupName: "Real\\EliteFX_ECN",
          leverage: "1:100",
          minDeposit: 500,
          active: true,
        },
        {
          planName: "Elite Pro",
          groupName: "Real\\EliteFX_Pro",
          leverage: "1:100",
          minDeposit: 1000,
          active: true,
        },
      ];
      await Plan.insertMany(defaultPlans);
      items = await Plan.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      total = defaultPlans.length;
    }

    return { items, total };
  }

  // SMTP Configuration
  async upsertSmtp(payload) {
    let smtp = await SmtpConfig.findOne();
    if (smtp) {
      Object.assign(smtp, payload);
      await smtp.save();
    } else {
      smtp = await SmtpConfig.create(payload);
    }
    return smtp;
  }

  async getSmtp() {
    return SmtpConfig.findOne();
  }

  // Emailer Configuration
  async createEmailer(payload) {
    return EmailerConfig.create(payload);
  }

  async updateEmailer(emailerId, payload) {
    const updated = await EmailerConfig.findByIdAndUpdate(emailerId, payload, {
      new: true,
    });
    if (!updated)
      throw new AppError("Emailer not found", 404, "EMAILER_NOT_FOUND");
    return updated;
  }

  async deleteEmailer(emailerId) {
    const deleted = await EmailerConfig.findByIdAndDelete(emailerId);
    if (!deleted)
      throw new AppError("Emailer not found", 404, "EMAILER_NOT_FOUND");
    return { id: emailerId, deleted: true };
  }

  async listEmailers(query) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 10, 10);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      EmailerConfig.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      EmailerConfig.countDocuments(),
    ]);

    return { items, total };
  }

  // Representatives Management
  async createRepresentative(payload) {
    const existing = await this.userRepository.findByEmail(payload.email);
    if (existing) {
      throw new AppError("Email already in use", 409, "EMAIL_CONFLICT");
    }

    const hash = await bcrypt.hash(payload.password, 12);
    const user = await this.userRepository.create({
      name: payload.name,
      email: payload.email,
      password: hash,
      role: "representative",
      kycStatus: "approved",
      ...payload, // Include status if passed
    });

    this.createAuditLog({
      userType: "admin",
      log: `Admin created new representative: ${user.email}`,
      metadata: { name: user.name, email: user.email },
    });

    return user;
  }

  async listRepresentatives(query) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 10, 10);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find({ role: "representative" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password"),
      User.countDocuments({ role: "representative" }),
    ]);

    return { items, total };
  }

  // Accounts Management
  async listMt5Accounts(query) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 10, 10);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Mt5Account.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Mt5Account.countDocuments(),
    ]);

    return { items, total };
  }

  // Fund Management
  async listTransactions(query) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 10, 10);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Transaction.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(),
    ]);

    return { items, total };
  }

  async updateTransactionStatus(transactionId, status) {
    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      throw new AppError("Transaction not found", 404, "TRANSACTION_NOT_FOUND");
    }

    if (tx.status !== "pending") {
      throw new AppError(
        "Transaction already processed",
        400,
        "TRANSACTION_ALREADY_PROCESSED",
      );
    }

    tx.status = status;
    await tx.save();

    // Send notification email
    const user = await User.findById(tx.userId);
    if (user) {
      const templateType =
        tx.type === "deposit" ? "DEPOSIT_UPDATE" : "WITHDRAW_UPDATE";
      mailService.sendTemplatedEmail(templateType, user.email, {
        NAME: user.name,
        TYPE: tx.type,
        AMOUNT: tx.amount,
        STATUS: tx.status,
      });
    }

    // If there is logic required for MT5 balance update, it should go here or be handled by an event

    this.createAuditLog({
      userType: "admin",
      log: `Admin ${status} ${tx.type} transaction for ${user?.email || "Unknown User"}`,
      metadata: { transactionId, status },
    });

    return tx;
  }
}

export { AdminService };
