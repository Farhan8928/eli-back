import { AppError } from "../../../common/errors/AppError.js";
import { Mt5AccountRepository } from "../repositories/mt5Account.repository.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { Mt5Client } from "../../../integrations/mt5/mt5.client.js";
import { AuditLog } from "../../admin/models/auditLog.model.js";
import { Plan } from "../../admin/models/plan.model.js";

class Mt5AccountService {
  constructor() {
    this.mt5AccountRepository = new Mt5AccountRepository();
    this.userRepository = new UserRepository();
    this.mt5Client = new Mt5Client();
  }

  async listPlans() {
    return Plan.find({ active: true }).sort({ minDeposit: 1 });
  }

  async createByClient(userContext, payload) {
    const user = await this.userRepository.findById(userContext.id);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const mt5Result = await this.mt5Client.createAccount({
      userId: String(user._id),
      name: user.name,
      email: user.email,
      ...payload,
    });

    const account = await this.mt5AccountRepository.create({
      userId: user._id,
      login: mt5Result.data.login,
      type: payload.type,
      server: mt5Result.data.server,
      leverage: payload.leverage,
      group: payload.group,
      credentials: {
        investorPassword: mt5Result.data.investorPassword || null,
        sentAt: new Date(),
      },
    });

    await this.userRepository.appendMt5Account(user._id, {
      accountId: account._id,
      login: account.login,
      type: account.type,
    });

    await AuditLog.create({
      userType: "client",
      log: `Client created new MT5 account: ${account.login}`,
      metadata: { userId: user._id, login: account.login, type: account.type }
    });

    return {
      account,
      credentialsDelivery: {
        channel: "secure-inbox",
        sentAt: account.credentials.sentAt,
      },
    };
  }

  async getMine(userContext) {
    const accounts = await this.mt5AccountRepository.findByUserId(
      userContext.id,
    );

    const enriched = await Promise.all(
      accounts.map(async (account) => {
        const remote = await this.mt5Client.getAccount(account.login);
        return {
          login: account.login,
          type: account.type,
          server: account.server,
          leverage: account.leverage,
          group: account.group,
          createdAt: account.createdAt,
          balance: remote.data.balance,
          equity: remote.data.equity,
          margin: remote.data.margin,
          openTrades: remote.data.openTrades,
          tradeHistory: remote.data.tradeHistory,
        };
      }),
    );

    return enriched;
  }

  async resetPasswordByAdmin(login, newPassword) {
    const account = await this.mt5AccountRepository.findByLogin(login);
    if (!account) {
      throw new AppError("MT5 account not found", 404, "MT5_ACCOUNT_NOT_FOUND");
    }

    await this.mt5Client.resetPassword({ login, newPassword });
    return { login, reset: true };
  }

  async resetPasswordByClient(userContext, login, newPassword) {
    const account = await this.mt5AccountRepository.findByLogin(login);
    if (!account || String(account.userId) !== String(userContext.id)) {
      throw new AppError("MT5 account not found or access denied", 404, "MT5_ACCOUNT_NOT_FOUND");
    }

    await this.mt5Client.resetPassword({ login, newPassword });

    await AuditLog.create({
      userType: "client",
      log: `Client reset password for MT5 account: ${login}`,
      metadata: { userId: userContext.id, login }
    });

    return { login, reset: true };
  }
}

export { Mt5AccountService };
