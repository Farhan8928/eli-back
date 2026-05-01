import { AppError } from "../../../common/errors/AppError.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { TransactionRepository } from "../repositories/transaction.repository.js";
import { AuditLog } from "../../admin/models/auditLog.model.js";

class TransactionService {
  constructor() {
    this.userRepository = new UserRepository();
    this.transactionRepository = new TransactionRepository();
  }

  async createManual(adminUser, payload) {
    const targetUser = await this.userRepository.findById(payload.userId);
    if (!targetUser || targetUser.role !== "client") {
      throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    return this.transactionRepository.create({
      userId: targetUser._id,
      type: payload.type,
      amount: payload.amount,
      status: "completed",
      note: payload.note || "",
      performedBy: adminUser.id,
    });
  }

  async getMine(user) {
    return this.transactionRepository.findByUserId(user.id);
  }

  async requestDeposit(userContext, payload) {
    const tx = await this.transactionRepository.create({
      userId: userContext.id,
      type: "deposit",
      amount: payload.amount,
      status: "pending",
      method: payload.method || "bank_transfer",
      proofUrl: payload.proofUrl || null,
      note: payload.note || "",
    });

    await AuditLog.create({
      userType: "client",
      log: `Client requested a deposit of $${payload.amount}`,
      metadata: { userId: userContext.id, transactionId: tx._id },
    });

    return tx;
  }

  async requestWithdrawal(userContext, payload) {
    // Check if user has bank details
    const user = await this.userRepository.findById(userContext.id);
    if (!user.bankDetails || !user.bankDetails.accountNumber) {
      throw new AppError(
        "Please update your bank details before withdrawing",
        400,
        "BANK_DETAILS_REQUIRED",
      );
    }

    const tx = await this.transactionRepository.create({
      userId: userContext.id,
      type: "withdraw",
      amount: payload.amount,
      status: "pending",
      method: "bank_transfer",
      note: payload.note || "",
    });

    await AuditLog.create({
      userType: "client",
      log: `Client requested a withdrawal of $${payload.amount}`,
      metadata: { userId: userContext.id, transactionId: tx._id },
    });

    return tx;
  }
}

export { TransactionService };
