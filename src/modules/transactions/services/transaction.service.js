const { AppError } = require("../../../common/errors/AppError");
const { UserRepository } = require("../../users/repositories/user.repository");
const {
  TransactionRepository,
} = require("../repositories/transaction.repository");

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
}

module.exports = { TransactionService };
