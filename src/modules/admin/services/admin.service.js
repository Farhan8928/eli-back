const { AppError } = require("../../../common/errors/AppError");
const { UserRepository } = require("../../users/repositories/user.repository");
const { User } = require("../../users/model/user.model");
const { Mt5Account } = require("../../mt5Accounts/model/mt5Account.model");
const { Transaction } = require("../../transactions/model/transaction.model");

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
    return updated;
  }

  async deleteUser(userId) {
    const deleted = await this.userRepository.deleteById(userId);
    if (!deleted) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return { id: userId, deleted: true };
  }

  async getSystemAnalytics() {
    const [
      totalClients,
      approvedKyc,
      totalMt5Accounts,
      totalDeposits,
      totalWithdrawals
    ] = await Promise.all([
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "client", kycStatus: "approved" }),
      Mt5Account.countDocuments(),
      Transaction.aggregate([
        { $match: { type: "deposit", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Transaction.aggregate([
        { $match: { type: "withdraw", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    return {
      totalClients,
      approvedKyc,
      totalMt5Accounts,
      totalDeposits: totalDeposits[0]?.total || 0,
      totalWithdrawals: totalWithdrawals[0]?.total || 0
    };
  }
}

module.exports = { AdminService };