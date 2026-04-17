import { Transaction } from "../model/transaction.model.js";

class TransactionRepository {
  async create(payload) {
    return Transaction.create(payload);
  }

  async findByUserId(userId) {
    return Transaction.find({ userId }).sort({ createdAt: -1 });
  }
}

export { TransactionRepository };
