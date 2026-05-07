import { AppError } from "../../../common/errors/AppError.js";
import { Mt5AccountRepository } from "../repositories/mt5Account.repository.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { Mt5Client } from "../../../integrations/mt5/mt5.client.js";
import { AuditLog } from "../../admin/models/auditLog.model.js";
import { Plan } from "../../admin/models/plan.model.js";
import { SmtpConfig } from "../../admin/models/smtp.model.js";
import { EmailerConfig } from "../../admin/models/emailer.model.js";
import { mailService } from "../../admin/services/mail.service.js";
import {
  mt5AutomationEnabled,
  mt5SupportEmail,
} from "../../../config/env.js";

function manualProvisioningMessage(intro, supportAddr) {
  const hint = supportAddr
    ? `Email ${supportAddr} and our team will handle it.`
    : "Contact support and our team will handle it manually.";
  return `${intro} ${hint}`;
}

class Mt5AccountService {
  constructor() {
    this.mt5AccountRepository = new Mt5AccountRepository();
    this.userRepository = new UserRepository();
    this.mt5Client = new Mt5Client();
  }

  async listPlans() {
    return Plan.find({ active: true }).sort({ minDeposit: 1 });
  }

  /** Prefer MT5_SUPPORT_EMAIL; otherwise the mailbox configured under Admin → SMTP (username). */
  async resolveSupportEmail() {
    if (mt5SupportEmail?.trim()) return mt5SupportEmail.trim();
    const smtp = await SmtpConfig.findOne().select("username").lean();
    const u = smtp?.username?.trim();
    return u || null;
  }

  async getProvisioningInfo() {
    const supportEmail = await this.resolveSupportEmail();
    return {
      automationEnabled: mt5AutomationEnabled,
      supportEmail,
    };
  }

  async notifyManualMt5AccountRequest(user, payload, supportAddr) {
    const placeholders = {
      NAME: String(user.name || "Trader"),
      EMAIL: String(user.email || ""),
      TYPE: String(payload.type || ""),
      LEVERAGE: String(payload.leverage ?? ""),
      GROUP: String(payload.group || ""),
    };

    const hasTpl = await EmailerConfig.findOne({
      emailerType: "MT5_ACCOUNT_PENDING",
    })
      .select("_id")
      .lean();

    let clientOk = false;

    if (hasTpl) {
      clientOk = await mailService.sendTemplatedEmail(
        "MT5_ACCOUNT_PENDING",
        user.email,
        placeholders,
      );
    }

    if (!clientOk) {
      const result = await mailService.sendMailDirect({
        to: user.email,
        subject: "Your trading account will be created shortly",
        html: `<p>Hi ${placeholders.NAME},</p>
<p>Thank you for your request. Your MetaTrader account will be created shortly. We will email you again with your login details as soon as it is ready.</p>
${supportAddr ? `<p>If you need help, contact us at ${supportAddr}.</p>` : ""}
<p>Best regards</p>`,
      });
      clientOk = result?.ok === true;
    }

    if (!clientOk) {
      throw new AppError(
        "Could not send confirmation email. Your administrator must configure SMTP under Admin → SMTP Settings.",
        500,
        "EMAIL_SEND_FAILED",
      );
    }

    if (
      supportAddr &&
      supportAddr.toLowerCase() !== String(user.email).toLowerCase()
    ) {
      await mailService.sendMailDirect({
        to: supportAddr,
        subject: `New MT5 account request — ${placeholders.EMAIL}`,
        html: `<p><strong>${placeholders.NAME}</strong> (${placeholders.EMAIL}) requested a new MT5 account.</p>
<ul>
<li>Type: ${placeholders.TYPE}</li>
<li>Leverage: 1:${placeholders.LEVERAGE}</li>
<li>Group: ${placeholders.GROUP}</li>
</ul>`,
      });
    }
  }

  async createByClient(userContext, payload) {
    const user = await this.userRepository.findById(userContext.id);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (!mt5AutomationEnabled) {
      const supportAddr = await this.resolveSupportEmail();
      await this.notifyManualMt5AccountRequest(user, payload, supportAddr);

      await AuditLog.create({
        userType: "client",
        log: `Client submitted MT5 account request (manual provisioning)`,
        metadata: {
          userId: user._id,
          email: user.email,
          type: payload.type,
          leverage: payload.leverage,
          group: payload.group,
        },
      });

      return {
        pending: true,
        account: null,
        credentialsDelivery: {
          channel: "email-confirmation",
          sentAt: new Date(),
        },
      };
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
      metadata: { userId: user._id, login: account.login, type: account.type },
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

    if (!mt5AutomationEnabled) {
      return accounts.map((account) => ({
        login: account.login,
        type: account.type,
        server: account.server,
        leverage: account.leverage,
        group: account.group,
        createdAt: account.createdAt,
        balance: Number(account.balance ?? 0),
        equity: Number(account.equity ?? 0),
        margin: undefined,
        openTrades: undefined,
        tradeHistory: undefined,
      }));
    }

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
    if (!mt5AutomationEnabled) {
      const supportAddr = await this.resolveSupportEmail();
      throw new AppError(
        manualProvisioningMessage(
          "MetaTrader password resets are processed manually.",
          supportAddr,
        ),
        503,
        "MT5_MANUAL_PROVISIONING",
      );
    }

    const account = await this.mt5AccountRepository.findByLogin(login);
    if (!account) {
      throw new AppError("MT5 account not found", 404, "MT5_ACCOUNT_NOT_FOUND");
    }

    await this.mt5Client.resetPassword({ login, newPassword });
    return { login, reset: true };
  }

  async resetPasswordByClient(userContext, login, newPassword) {
    if (!mt5AutomationEnabled) {
      const supportAddr = await this.resolveSupportEmail();
      throw new AppError(
        manualProvisioningMessage(
          "MetaTrader password resets are processed manually.",
          supportAddr,
        ),
        503,
        "MT5_MANUAL_PROVISIONING",
      );
    }

    const account = await this.mt5AccountRepository.findByLogin(login);
    if (!account || String(account.userId) !== String(userContext.id)) {
      throw new AppError(
        "MT5 account not found or access denied",
        404,
        "MT5_ACCOUNT_NOT_FOUND",
      );
    }

    await this.mt5Client.resetPassword({ login, newPassword });

    await AuditLog.create({
      userType: "client",
      log: `Client reset password for MT5 account: ${login}`,
      metadata: { userId: userContext.id, login },
    });

    return { login, reset: true };
  }
}

export { Mt5AccountService };
