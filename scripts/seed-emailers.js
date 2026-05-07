/**
 * Syncs EmailerConfig with what the backend actually uses:
 * - Inserts missing defaults for: KYC_*, CLIENT_PORTAL_WELCOME, MT5_*, WITHDRAW_UPDATE, DEPOSIT_UPDATE
 * - Deletes obsolete types replaced by WITHDRAW_UPDATE / DEPOSIT_UPDATE:
 *   WITHDRAWAL_COMPLETED, WITHDRAWAL_REJECTED, DEPOSIT_COMPLETED, DEPOSIT_REJECTED
 *
 * Skips types you already added manually (e.g. FORGOT_PASSWORD, legacy WELCOME_EMAIL).
 *
 * Run from `elite-fx-back`:
 *   npm run seed:emailers
 *
 * Requires MONGO_URI in .env
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { EmailerConfig } from "../src/modules/admin/models/emailer.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

const wrap = (inner) => `<div style="font-family:Segoe UI,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a;line-height:1.5;">
${inner}
<p style="margin-top:24px;font-size:12px;color:#64748b;">Elite FX</p>
</div>`;

/** Default HTML templates; edit later in Admin → Email Templates */
const DEFAULT_EMAILERS = [
  {
    emailerType: "KYC_PENDING",
    mailSubject: "KYC update — {STATUS}",
    mailTemplateParameter: "{NAME}, {STATUS}",
    mailBody: wrap(
      `<p>Hi {NAME},</p>
<p>Your verification (KYC) status is now: <strong>{STATUS}</strong>.</p>
<p>Log in to your portal to complete any outstanding steps.</p>`,
    ),
  },
  {
    emailerType: "KYC_APPROVED",
    mailSubject: "Your KYC has been approved",
    mailTemplateParameter: "{NAME}, {STATUS}",
    mailBody: wrap(
      `<p>Hi {NAME},</p>
<p>Good news — your KYC is <strong>approved</strong>. You can continue using all eligible features.</p>`,
    ),
  },
  {
    emailerType: "KYC_REJECTED",
    mailSubject: "KYC update required",
    mailTemplateParameter: "{NAME}, {STATUS}",
    mailBody: wrap(
      `<p>Hi {NAME},</p>
<p>We could not approve your documents at this time. Please sign in and upload updated files or contact support.</p>`,
    ),
  },
  {
    emailerType: "CLIENT_PORTAL_WELCOME",
    mailSubject: "Welcome to your Elite FX client portal",
    mailTemplateParameter: "{NAME}, {EMAIL}",
    mailBody: wrap(
      `<p>Hi {NAME},</p>
<p>Welcome — you are signed in to your trading portal.</p>
<p>Use the dashboard to manage accounts, funding, and settings. If you need help, reply to this email.</p>`,
    ),
  },
  {
    emailerType: "MT5_ACCOUNT_PENDING",
    mailSubject: "We received your MT5 account request",
    mailTemplateParameter:
      "{NAME}, {EMAIL}, {TYPE}, {LEVERAGE}, {GROUP}, {SUPPORT_EMAIL}",
    mailBody: wrap(
      `<p>Hi {NAME},</p>
<p>Thank you for your request. Our team will create your MetaTrader account and email you again when it is ready.</p>
<p><strong>Requested:</strong> {TYPE} · Leverage 1:{LEVERAGE} · Group {GROUP}</p>
<p style="word-break:break-all;">If you need help: {SUPPORT_EMAIL}</p>`,
    ),
  },
  {
    emailerType: "MT5_ACCOUNT_REQUEST_STAFF",
    mailSubject: "New MT5 request — {EMAIL}",
    mailTemplateParameter:
      "{NAME}, {EMAIL}, {TYPE}, {LEVERAGE}, {GROUP}, {SUPPORT_EMAIL}",
    mailBody: wrap(
      `<p><strong>{NAME}</strong> ({EMAIL}) submitted a manual MT5 request.</p>
<ul style="padding-left:20px;">
<li>Type: {TYPE}</li>
<li>Leverage: 1:{LEVERAGE}</li>
<li>Group: {GROUP}</li>
</ul>`,
    ),
  },
  {
    emailerType: "MT5_CREDENTIALS_DELIVERED",
    mailSubject: "Your MetaTrader 5 login details",
    mailTemplateParameter: "{NAME}, {EMAIL}, {LOGIN}, {PASSWORD}, {SERVER}",
    mailBody: wrap(
      `<p>Hi {NAME},</p>
<p>Your trading account is ready. Log in to MetaTrader 5 with:</p>
<ul style="padding-left:20px;">
<li><strong>Login:</strong> {LOGIN}</li>
<li><strong>Password (master):</strong> {PASSWORD}</li>
<li><strong>Server:</strong> {SERVER}</li>
</ul>
<p style="font-size:14px;color:#475569;">For security, change your password in the MT5 terminal after first login if your broker recommends it.</p>`,
    ),
  },
  {
    emailerType: "WITHDRAW_UPDATE",
    mailSubject: "Withdrawal update — {STATUS}",
    mailTemplateParameter: "{NAME}, {EMAIL}, {AMOUNT}, {TYPE}, {STATUS}",
    mailBody: wrap(
      `<p>Hi {NAME},</p>
<p>Your <strong>withdrawal</strong> of <strong>${"{AMOUNT}"}</strong> (USD) is now <strong>{STATUS}</strong>.</p>
<p>If status is <strong>completed</strong>, funds should reach your bank on standard timelines. If <strong>rejected</strong>, check your dashboard or contact support.</p>`,
    ),
  },
  {
    emailerType: "DEPOSIT_UPDATE",
    mailSubject: "Deposit update — {STATUS}",
    mailTemplateParameter: "{NAME}, {EMAIL}, {AMOUNT}, {TYPE}, {STATUS}",
    mailBody: wrap(
      `<p>Hi {NAME},</p>
<p>Your <strong>deposit</strong> of <strong>${"{AMOUNT}"}</strong> (USD) is now <strong>{STATUS}</strong>.</p>
<p>If <strong>completed</strong>, the amount is credited to your portal balance. If <strong>rejected</strong>, contact support with your proof of payment if needed.</p>`,
    ),
  },
];

async function main() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const obsolete = [
    "WITHDRAWAL_COMPLETED",
    "WITHDRAWAL_REJECTED",
    "DEPOSIT_COMPLETED",
    "DEPOSIT_REJECTED",
  ];
  const { deletedCount } = await EmailerConfig.deleteMany({
    emailerType: { $in: obsolete },
  });
  if (deletedCount > 0) {
    console.log(
      `Removed ${deletedCount} obsolete template(s) (replaced by WITHDRAW_UPDATE / DEPOSIT_UPDATE): ${obsolete.join(", ")}`,
    );
  }

  let created = 0;
  let skipped = 0;

  for (const row of DEFAULT_EMAILERS) {
    const exists = await EmailerConfig.findOne({
      emailerType: row.emailerType,
    }).lean();
    if (exists) {
      console.log(`Skip (already exists): ${row.emailerType}`);
      skipped += 1;
      continue;
    }
    await EmailerConfig.create({
      emailerType: row.emailerType,
      mailSubject: row.mailSubject,
      mailBody: row.mailBody,
      mailTemplateParameter: row.mailTemplateParameter,
      ccMail: "",
    });
    console.log(`Created: ${row.emailerType}`);
    created += 1;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
