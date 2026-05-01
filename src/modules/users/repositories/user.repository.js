import { User } from "../model/user.model.js";

class UserRepository {
  async create(payload) {
    return User.create(payload);
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findById(userId) {
    return User.findById(userId);
  }

  async findAllClients({ page, limit, search }) {
    const skip = (page - 1) * limit;
    const filter = { 
      role: "client",
      ...(search ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password"),
      User.countDocuments(filter),
    ]);

    return { items, total };
  }

  async updateById(userId, payload) {
    return User.findByIdAndUpdate(userId, payload, { new: true }).select(
      "-password",
    );
  }

  async deleteById(userId) {
    return User.findByIdAndDelete(userId);
  }

  async appendMt5Account(userId, mt5Ref) {
    return User.findByIdAndUpdate(
      userId,
      { $push: { mt5Accounts: mt5Ref } },
      { new: true },
    ).select("-password");
  }
}

export { UserRepository };
