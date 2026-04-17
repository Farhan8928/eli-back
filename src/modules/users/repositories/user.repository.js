const { User } = require("../model/user.model");

class UserRepository {
  async create(payload) {
    return User.create(payload);
  }

  async findByEmail(email) {
    return User.findOne({ email });
  }

  async findById(userId) {
    return User.findById(userId);
  }

  async findAllClients({ page, limit }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find({ role: "client" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password"),
      User.countDocuments({ role: "client" })
    ]);

    return { items, total };
  }

  async updateById(userId, payload) {
    return User.findByIdAndUpdate(userId, payload, { new: true }).select("-password");
  }

  async deleteById(userId) {
    return User.findByIdAndDelete(userId);
  }

  async appendMt5Account(userId, mt5Ref) {
    return User.findByIdAndUpdate(
      userId,
      { $push: { mt5Accounts: mt5Ref } },
      { new: true }
    ).select("-password");
  }
}

module.exports = { UserRepository };