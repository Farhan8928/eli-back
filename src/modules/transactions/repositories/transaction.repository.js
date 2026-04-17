const { Transaction } = require("../model/transaction.model");

class TransactionRepository {
  async create(payload) {
    return Transaction.create(payload);
  }

  async findByUserId(userId) {
    return Transaction.find({ userId }).sort({ createdAt: -1 });
  }
}

module.exports = { TransactionRepository };
