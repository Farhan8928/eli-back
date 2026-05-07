import nodemailer from "nodemailer";
import { SmtpConfig } from "../models/smtp.model.js";
import { EmailerConfig } from "../models/emailer.model.js";
import { logger } from "../../../common/utils/logger.js";

class MailService {
  async getTransporter() {
    const config = await SmtpConfig.findOne();
    if (!config) {
      throw new Error("SMTP Configuration not found in database");
    }

    return nodemailer.createTransport({
      host: config.server,
      port: config.port,
      secure: config.ssl, // true for 465, false for other ports
      auth: {
        user: config.username,
        pass: config.password,
      },
      connectionTimeout: config.timeoutMs || 5000,
    });
  }

  /**
   * Sends an email based on a predefined template type
   * @param {string} emailerType - e.g., 'WELCOME_EMAIL', 'DEPOSIT_CONFIRM'
   * @param {string} toEmail - Recipient email
   * @param {Object} placeholders - Key-value pairs for template replacement
   */
  async sendTemplatedEmail(emailerType, toEmail, placeholders = {}) {
    try {
      const template = await EmailerConfig.findOne({ emailerType });
      if (!template) {
        logger.warn(
          `Email template for type ${emailerType} not found. Skipping email.`,
        );
        return false;
      }

      const transporter = await this.getTransporter();

      // Replace placeholders in subject and body
      let body = template.mailBody;
      let subject = template.mailSubject;

      Object.keys(placeholders).forEach((key) => {
        const regex = new RegExp(`{${key}}`, "g");
        body = body.replace(regex, placeholders[key]);
        subject = subject.replace(regex, placeholders[key]);
      });

      const mailOptions = {
        from: (await SmtpConfig.findOne()).username,
        to: toEmail,
        subject: subject,
        html: body,
        cc: template.ccMail || undefined,
        bcc: template.bccMail || undefined,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(
        `Email sent: ${emailerType} to ${toEmail}. MessageId: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      logger.error(`Failed to send email ${emailerType} to ${toEmail}:`, error);
      return false;
    }
  }

  async sendMailDirect({ to, subject, html, cc, bcc }) {
    try {
      const config = await SmtpConfig.findOne();
      if (!config) {
        logger.warn("sendMailDirect: SMTP is not configured");
        return { ok: false };
      }

      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: config.username,
        to,
        subject,
        html,
        ...(cc ? { cc } : {}),
        ...(bcc ? { bcc } : {}),
      });
      logger.info(`sendMailDirect to ${to} MessageId: ${info.messageId}`);
      return { ok: true };
    } catch (error) {
      logger.error("sendMailDirect failed:", error);
      return { ok: false };
    }
  }
}

export const mailService = new MailService();
