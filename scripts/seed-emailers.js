/**
 * Syncs EmailerConfig with what the backend actually uses:
 * - Inserts missing defaults for: KYC_*, CLIENT_PORTAL_WELCOME, FORGOT_PASSWORD, MT5_*, WITHDRAW_UPDATE, DEPOSIT_UPDATE
 * - Deletes obsolete types replaced by WITHDRAW_UPDATE / DEPOSIT_UPDATE:
 *   WITHDRAWAL_COMPLETED, WITHDRAWAL_REJECTED, DEPOSIT_COMPLETED, DEPOSIT_REJECTED
 *
 * Skips any emailerType not listed below (custom admin-only types stay untouched).
 *
 * Run from `elite-fx-back`:
 *   npm run seed:emailers              — inserts missing types only (never overwrites)
 *   npm run seed:emailers:sync         — same + overwrites body/subject/params for defaults below
 *   (or: npm run seed:emailers -- --sync)
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

const syncExisting = process.argv.includes("--sync");
if (syncExisting) {
  console.log(
    "Mode: --sync (will overwrite mail subject/body/parameters for seeded types)\n",
  );
}

/**
 * Elite FX brand palette — mirrors elite-fx-front/src/index.css
 * (--primary #2d7df6, --accent / deep navies, --background dark ~214 45% 8%)
 */
const BRAND = {
  primary: "#2d7df6",
  accentNavy: "#0b1a2b",
  pageBg: "#070c12",
  text: "#1e293b",
  textMuted: "#64748b",
  textSubtle: "#475569",
  border: "#e2e8f0",
  footerBg: "#f8fafc",
  primarySoft: "#eff6ff",
  primaryBorder: "#93c5fd",
  success: "#0d9488",
  successIcon: "#0f766e",
  pillFg: "#1e40af",
  pillBg: "#dbeafe",
};

const font = "Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Email-safe HTML shell: tables, inline styles only (broad client support). */
const wrap = (
  bodyHtml,
  tagline = "Elite FX Client Services",
) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Elite FX</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f7fa;">
<tr>
<td align="center" style="padding:40px 20px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 0 0 1px rgba(0,0,0,0.06);">
<tr>
<td style="background:linear-gradient(135deg,${BRAND.accentNavy} 0%,${BRAND.pageBg} 100%);padding:40px 32px;text-align:center;border-bottom:4px solid ${BRAND.primary};">
<a href="https://www.elitefx.in" target="_blank" rel="noopener noreferrer" style="display:block;margin:0 auto;">
<img src="https://www.elitefx.in/elite-fx-logo.png" alt="Elite FX" style="max-width:280px;height:auto;margin:0 auto;display:block;" width="280">
</a>
<p style="margin:16px 0 0;font-family:${font};font-size:14px;font-weight:500;letter-spacing:0.05em;color:#94a3b8;text-transform:uppercase;">${tagline}</p>
</td>
</tr>
<tr>
<td style="padding:40px 32px;font-family:${font};font-size:16px;line-height:1.7;color:${BRAND.text};">
${bodyHtml}
</td>
</tr>
<tr>
<td style="padding:32px 32px;background-color:#f8fafc;border-top:1px solid ${BRAND.border};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td align="center" style="font-family:${font};font-size:13px;line-height:1.6;color:${BRAND.textMuted};">
<p style="margin:0 0 12px;"><strong style="color:${BRAND.accentNavy};font-size:14px;">Elite FX</strong></p>
<p style="margin:0 0 8px;">Professional Trading Solutions Since 2013</p>
<p style="margin:0;">You are receiving this email because you have an account with us.</p>
<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">This is an automated message. For support, please contact us through your client portal.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

const p = (html) =>
  `<p style="margin:0 0 16px;font-family:${font};font-size:16px;line-height:1.65;color:${BRAND.text};">${html}</p>`;

const strong = (text) =>
  `<strong style="color:${BRAND.accentNavy};font-weight:600;">${text}</strong>`;

const infoBox = (
  html,
  borderColor = BRAND.primaryBorder,
  bg = BRAND.primarySoft,
) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;border-radius:12px;border:1px solid ${borderColor};background-color:${bg};box-shadow:0 1px 3px rgba(0,0,0,0.04);">
<tr><td style="padding:24px 26px;font-family:${font};font-size:15px;line-height:1.6;color:${BRAND.textSubtle};">
${html}
</td></tr></table>`;

const statusPill = (text) =>
  `<span style="display:inline-block;padding:8px 18px;font-family:${font};font-size:13px;font-weight:600;color:${BRAND.pillFg};background-color:${BRAND.pillBg};border-radius:999px;letter-spacing:0.02em;">${text}</span>`;

/** Default HTML templates; edit later in Admin → Email Templates */
const DEFAULT_EMAILERS = [
  {
    emailerType: "KYC_PENDING",
    mailSubject: "KYC update — {STATUS}",
    mailTemplateParameter: "{NAME}, {STATUS}",
    mailBody: wrap(
      `${p(`Hi ${strong("{NAME}")},`)}
${p(`Your verification <strong style="color:${BRAND.accentNavy};">(KYC)</strong> status is now: ${statusPill("{STATUS}")}`)}
${infoBox(`Log in to your client portal to upload documents or finish any outstanding steps. Our team will review your submission as soon as possible.`, BRAND.primaryBorder, BRAND.primarySoft)}
${p("Thank you for choosing Elite FX.")}`,
      "Identity verification update",
    ),
  },
  {
    emailerType: "KYC_APPROVED",
    mailSubject: "Your KYC has been approved",
    mailTemplateParameter: "{NAME}, {STATUS}",
    mailBody: wrap(
      `${p(`Hi ${strong("{NAME}")},`)}
${p(`Great news — your identity verification is ${strong("approved")}. You can now use all features available for verified clients.`)}
${infoBox(`<span style="color:${BRAND.successIcon};font-weight:600;">✓</span> &nbsp;Your account is fully verified. Explore funding and trading tools from your dashboard.`, "#a7f3d0", "#ecfdf5")}
${p("Welcome to the next step of your trading journey with Elite FX.")}`,
      "Verification approved",
    ),
  },
  {
    emailerType: "KYC_REJECTED",
    mailSubject: "KYC update required",
    mailTemplateParameter: "{NAME}, {STATUS}",
    mailBody: wrap(
      `${p(`Hi ${strong("{NAME}")},`)}
${p("We weren't able to approve your documents with the files provided.")}
${infoBox(`Please sign in and ${strong("upload clearer or updated proof")} (ID and address documents as requested). If you need help, contact support with this email in reference.`, "#fecaca", "#fef2f2")}
${p("We're here to get you verified as smoothly as possible.")}`,
      "Action needed on your documents",
    ),
  },
  {
    emailerType: "CLIENT_PORTAL_WELCOME",
    mailSubject: "Welcome to your Elite FX client portal",
    mailTemplateParameter: "{NAME}, {EMAIL}",
    mailBody: wrap(
      `${p(`Hi ${strong("{NAME}")},`)}
${p(`Your Elite FX client portal is ready. You're signed in as ${strong("{EMAIL}")}.`)}
${infoBox(
  `${strong("What you can do:")}<br><br>
• View balances and trading accounts<br>
• Request deposits and withdrawals<br>
• Manage your profile and verification<br>
• Download platform guides`,
  BRAND.primaryBorder,
  BRAND.primarySoft,
)}
${p("If you did not create this account, please contact us immediately.")}`,
      "Welcome aboard",
    ),
  },
  {
    emailerType: "FORGOT_PASSWORD",
    mailSubject: "Your Elite FX password has been reset",
    mailTemplateParameter: "{NAME}, {PASSWORD}",
    mailBody: wrap(
      `${p(`Hi ${strong("{NAME}")},`)}
${p(`We received a request to reset your client portal password. A ${strong("temporary password")} has been generated. Sign in with it once, then change your password from your profile.`)}
${infoBox(
  `<p style="margin:0 0 10px;font-size:14px;color:${BRAND.textSubtle};">Temporary password</p>
<p style="margin:0;font-family:Consolas,monospace;font-size:20px;font-weight:700;letter-spacing:0.04em;color:${BRAND.accentNavy};word-break:break-all;">{PASSWORD}</p>`,
  BRAND.primaryBorder,
  BRAND.primarySoft,
)}
${p(`<span style="font-size:14px;color:${BRAND.textMuted};">For security, do not forward this email. If you did not request a reset, contact support immediately.</span>`)}`,
      "Password reset",
    ),
  },
  {
    emailerType: "MT5_ACCOUNT_PENDING",
    mailSubject: "We received your MT5 account request",
    mailTemplateParameter:
      "{NAME}, {EMAIL}, {TYPE}, {LEVERAGE}, {GROUP}, {SUPPORT_EMAIL}",
    mailBody: wrap(
      `${p(`Hi ${strong("{NAME}")},`)}
${p(`Thank you — we've received your <strong style="color:${BRAND.accentNavy};">MetaTrader 5</strong> account request. Our team will set it up and notify you when it's ready.`)}
${infoBox(
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;">
<tr><td style="padding:6px 0;color:${BRAND.textMuted};width:100px;">Type</td><td style="padding:6px 0;font-weight:600;color:${BRAND.accentNavy};">{TYPE}</td></tr>
<tr><td style="padding:6px 0;color:${BRAND.textMuted};">Leverage</td><td style="padding:6px 0;font-weight:600;color:${BRAND.accentNavy};">1:{LEVERAGE}</td></tr>
<tr><td style="padding:6px 0;color:${BRAND.textMuted};">Group</td><td style="padding:6px 0;font-weight:600;color:${BRAND.accentNavy};">{GROUP}</td></tr>
</table>`,
  BRAND.border,
  BRAND.footerBg,
)}
${p(`Questions? Reach us at: <span style="word-break:break-all;color:${BRAND.primary};">{SUPPORT_EMAIL}</span>`)}`,
      "MT5 request received",
    ),
  },
  {
    emailerType: "MT5_ACCOUNT_REQUEST_STAFF",
    mailSubject: "New MT5 request — {EMAIL}",
    mailTemplateParameter:
      "{NAME}, {EMAIL}, {TYPE}, {LEVERAGE}, {GROUP}, {SUPPORT_EMAIL}",
    mailBody: wrap(
      `${p(`${strong("New manual MT5 request")} — action may be required in the CRM.`)}
${infoBox(
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;">
<tr><td style="padding:6px 0;color:${BRAND.textMuted};width:110px;">Client</td><td style="padding:6px 0;font-weight:600;color:${BRAND.accentNavy};">{NAME}</td></tr>
<tr><td style="padding:6px 0;color:${BRAND.textMuted};">Email</td><td style="padding:6px 0;font-weight:600;color:${BRAND.accentNavy};word-break:break-all;">{EMAIL}</td></tr>
<tr><td style="padding:6px 0;color:${BRAND.textMuted};">Type</td><td style="padding:6px 0;">{TYPE}</td></tr>
<tr><td style="padding:6px 0;color:${BRAND.textMuted};">Leverage</td><td style="padding:6px 0;">1:{LEVERAGE}</td></tr>
<tr><td style="padding:6px 0;color:${BRAND.textMuted};">Group</td><td style="padding:6px 0;">{GROUP}</td></tr>
</table>`,
  BRAND.primaryBorder,
  BRAND.primarySoft,
)}
${p(`Support contact on file: <span style="word-break:break-all;color:${BRAND.primary};">{SUPPORT_EMAIL}</span>`)}`,
      "Internal — MT5 provisioning",
    ),
  },
  {
    emailerType: "MT5_CREDENTIALS_DELIVERED",
    mailSubject: "Your MetaTrader 5 login details",
    mailTemplateParameter: "{NAME}, {EMAIL}, {LOGIN}, {PASSWORD}, {INVESTOR_PASSWORD}, {SERVER}",
    mailBody: wrap(
      `${p(`Hi ${strong("{NAME}")},`)}
${p(`Your MetaTrader 5 account is <strong style="color:${BRAND.success};">ready</strong>. Use the credentials below in the MT5 terminal or mobile app.`)}
${infoBox(
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;">
<tr><td style="padding:8px 0;color:${BRAND.textMuted};width:140px;vertical-align:top;">Login</td><td style="padding:8px 0;font-family:Consolas,monospace;font-weight:700;color:${BRAND.accentNavy};font-size:16px;">{LOGIN}</td></tr>
<tr><td style="padding:8px 0;color:${BRAND.textMuted};vertical-align:top;">Password</td><td style="padding:8px 0;font-family:Consolas,monospace;font-weight:600;color:${BRAND.accentNavy};">{PASSWORD}</td></tr>
<tr><td style="padding:8px 0;color:${BRAND.textMuted};vertical-align:top;">Investor Password</td><td style="padding:8px 0;font-family:Consolas,monospace;font-weight:600;color:${BRAND.accentNavy};">{INVESTOR_PASSWORD}</td></tr>
<tr><td style="padding:8px 0;color:${BRAND.textMuted};vertical-align:top;">Server</td><td style="padding:8px 0;font-family:Consolas,monospace;color:${BRAND.accentNavy};">{SERVER}</td></tr>
</table>`,
  BRAND.primaryBorder,
  BRAND.primarySoft,
)}
${p(`<span style="font-size:14px;color:${BRAND.textMuted};">Security tip: change your master password after first login if your broker recommends it. Never share these details with anyone.</span>`)}`,
      "Your MT5 credentials",
    ),
  },
  {
    emailerType: "WITHDRAW_UPDATE",
    mailSubject: "Withdrawal update — {STATUS}",
    mailTemplateParameter: "{NAME}, {EMAIL}, {AMOUNT}, {TYPE}, {STATUS}",
    mailBody: wrap(
      `${p(`Hi ${strong("{NAME}")},`)}
${p(`We're writing to update you on your ${strong("withdrawal")}.`)}
${infoBox(
  `<p style="margin:0 0 12px;font-size:15px;color:${BRAND.textSubtle};">Amount</p>
<p style="margin:0;font-size:28px;font-weight:700;color:${BRAND.accentNavy};">$${"{AMOUNT}"} <span style="font-size:14px;font-weight:500;color:${BRAND.textMuted};">USD</span></p>
<p style="margin:16px 0 0;font-size:14px;">Status: ${statusPill("{STATUS}")}</p>`,
  BRAND.border,
  BRAND.footerBg,
)}
${p("If <strong>completed</strong>, funds typically follow your bank's transfer timelines. If <strong>rejected</strong>, check your dashboard or reply with your reference details.")}`,
      "Withdrawal notification",
    ),
  },
  {
    emailerType: "DEPOSIT_UPDATE",
    mailSubject: "Deposit update — {STATUS}",
    mailTemplateParameter: "{NAME}, {EMAIL}, {AMOUNT}, {TYPE}, {STATUS}",
    mailBody: wrap(
      `${p(`Hi ${strong("{NAME}")},`)}
${p(`We're writing to update you on your ${strong("deposit")}.`)}
${infoBox(
  `<p style="margin:0 0 12px;font-size:15px;color:${BRAND.textSubtle};">Amount</p>
<p style="margin:0;font-size:28px;font-weight:700;color:${BRAND.accentNavy};">$${"{AMOUNT}"} <span style="font-size:14px;font-weight:500;color:${BRAND.textMuted};">USD</span></p>
<p style="margin:16px 0 0;font-size:14px;">Status: ${statusPill("{STATUS}")}</p>`,
  "#d1fae5",
  "#ecfdf5",
)}
${p("If <strong>completed</strong>, your portal balance should reflect the credit. If <strong>rejected</strong>, contact support and include your payment proof if needed.")}`,
      "Deposit notification",
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
  let updated = 0;
  let unchanged = 0;

  for (const row of DEFAULT_EMAILERS) {
    const exists = await EmailerConfig.findOne({
      emailerType: row.emailerType,
    }).lean();
    if (exists) {
      if (syncExisting) {
        const res = await EmailerConfig.updateOne(
          { emailerType: row.emailerType },
          {
            $set: {
              mailSubject: row.mailSubject,
              mailBody: row.mailBody,
              mailTemplateParameter: row.mailTemplateParameter,
            },
          },
        );
        if (res.modifiedCount > 0) {
          console.log(`Updated: ${row.emailerType}`);
          updated += 1;
        } else {
          console.log(`Unchanged (already matches file): ${row.emailerType}`);
          unchanged += 1;
        }
      } else {
        console.log(`Skip (already exists): ${row.emailerType}`);
        skipped += 1;
      }
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

  const summary = syncExisting
    ? `Created ${created}, updated ${updated}, unchanged ${unchanged}.`
    : `Created ${created}, skipped ${skipped} (existing rows kept; use --sync to refresh HTML).`;
  console.log(`\nDone. ${summary}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
