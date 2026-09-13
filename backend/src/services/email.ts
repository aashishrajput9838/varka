import "dotenv/config";
import nodemailer, { type Transporter } from "nodemailer";
import config from "../config/index.js";

const { smtpHost, smtpPort, smtpUser, smtpPass, emailFrom } = config;

// Check if credentials are placeholders or dummy
const isPlaceholderCredential = (user?: string, pass?: string): boolean => {
  if (!user || !pass) return true;
  const lowerUser = user.toLowerCase().trim();
  const lowerPass = pass.toLowerCase().trim();
  return (
    lowerUser.includes("apna_email") ||
    lowerUser.includes("example.com") ||
    lowerPass === "abcdefghijklmnop"
  );
};

const hasRealSmtp = !isPlaceholderCredential(smtpUser, smtpPass);

let transporter: Transporter | null = null;

if (hasRealSmtp && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for 587
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  transporter.verify((error: Error | null) => {
    if (error) {
      console.warn("⚠️  [EMAIL SERVICE] SMTP verification warning:", error.message);
    } else {
      console.log("✅ [EMAIL SERVICE] SMTP transporter ready to deliver emails via", smtpHost);
    }
  });
} else {
  console.log("ℹ️  [EMAIL SERVICE] Running in simulated/dev mode (SMTP placeholder credentials detected).");
}

const printConsoleOtp = (to: string, purpose: string, otp: string, firstName?: string) => {
  console.log(`\n┌────────────────────────────────────────────────────────────┐`);
  console.log(`│               VARKA FREIGHT AUTH DISPATCH                 │`);
  console.log(`├────────────────────────────────────────────────────────────┤`);
  console.log(`│ Recipient: ${to.padEnd(46)} │`);
  console.log(`│ User:      ${(firstName || "Freight Member").padEnd(46)} │`);
  console.log(`│ Purpose:   ${purpose.padEnd(46)} │`);
  console.log(`│                                                            │`);
  console.log(`│               >>>   OTP CODE: ${otp}   <<<              │`);
  console.log(`│                                                            │`);
  console.log(`│ Valid for: 10 minutes                                      │`);
  console.log(`└────────────────────────────────────────────────────────────┘\n`);
};

export const getSmtpStatus = () => {
  return {
    configured: Boolean(hasRealSmtp && transporter && smtpUser),
    host: smtpHost || "smtp.gmail.com",
    port: smtpPort || 465,
    userConfigured: Boolean(smtpUser),
    senderConfigured: Boolean(emailFrom || smtpUser),
  };
};

export const sendVerificationEmail = async (
  to: string,
  firstName: string,
  otp: string
): Promise<{ sent: boolean; reason?: string }> => {
  printConsoleOtp(to, "Email Address Verification", otp, firstName);

  if (!hasRealSmtp || !transporter || !smtpUser) {
    console.warn(`[EMAIL SERVICE] Email not sent to ${to}: SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS on Railway.`);
    return { sent: false, reason: "SMTP simulated/unconfigured" };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your VARKA Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0c0907;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #ede4d8;
    }
    .email-container {
      max-width: 540px;
      margin: 30px auto;
      background: #171310;
      border: 1px solid #332821;
      padding: 40px 32px;
      border-radius: 4px;
    }
    .brand-header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #281f19;
      margin-bottom: 28px;
    }
    .brand-title {
      font-size: 24px;
      letter-spacing: 0.18em;
      font-weight: 700;
      color: #ede4d8;
      text-transform: uppercase;
      margin: 0 0 6px;
    }
    .brand-subtitle {
      font-size: 11px;
      letter-spacing: 0.12em;
      color: #c65d2c;
      text-transform: uppercase;
      margin: 0;
    }
    .greeting {
      font-size: 18px;
      margin: 0 0 16px;
      color: #ffffff;
    }
    .copy-text {
      font-size: 14px;
      line-height: 1.6;
      color: #b0a498;
      margin: 0 0 24px;
    }
    .otp-card {
      background: #0e0b09;
      border: 1px solid #c65d2c;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
      border-radius: 4px;
    }
    .otp-label {
      font-size: 11px;
      letter-spacing: 0.1em;
      color: #8c7e72;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 12px;
      color: #ede4d8;
      margin: 0;
      padding-left: 12px;
    }
    .expiry-note {
      font-size: 12px;
      color: #8c7e72;
      text-align: center;
      margin: 0 0 28px;
    }
    .security-notice {
      background: rgba(198, 93, 44, 0.08);
      border-left: 3px solid #c65d2c;
      padding: 12px 16px;
      font-size: 12px;
      line-height: 1.5;
      color: #b0a498;
      margin-bottom: 30px;
    }
    .footer {
      border-top: 1px solid #281f19;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #665b51;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="brand-header">
      <h1 class="brand-title">VARKA</h1>
      <p class="brand-subtitle">Intelligent Freight Decision Engine</p>
    </div>

    <p class="greeting">Hello ${firstName || "there"},</p>
    <p class="copy-text">
      Please use the single-use verification code below to verify your email address and activate your VARKA account.
    </p>

    <div class="otp-card">
      <div class="otp-label">Verification Code</div>
      <div class="otp-code">${otp}</div>
    </div>

    <p class="expiry-note">
      ⏱️ This code will expire in <strong>10 minutes</strong>.
    </p>

    <div class="security-notice">
      <strong>Security Notice:</strong> Never share this code with anyone. VARKA team members will never ask for your verification code or account password.
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} VARKA Technologies Inc. All rights reserved.<br>
      High-Performance Freight Forecasting & Fleet Optimization.
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
VARKA — Intelligent Freight Engine
Your Verification Code: ${otp}

Hello ${firstName || "there"},

Use the code below to complete your registration:
${otp}

This code expires in 10 minutes.

If you did not request this, please ignore this message.
© ${new Date().getFullYear()} VARKA Technologies Inc.
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: emailFrom || `VARKA <${smtpUser}>`,
      to,
      subject: `${otp} is your VARKA verification code`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`✉️  [EMAIL SERVICE] Verification email sent to ${to} (Message ID: ${info.messageId})`);
    return { sent: true };
  } catch (error: any) {
    console.error(`❌ [EMAIL SERVICE] Failed to send email to ${to}:`, error.message);
    return { sent: false, reason: error.message };
  }
};

export const sendPasswordResetEmail = async (
  to: string,
  firstName: string,
  otp: string
): Promise<{ sent: boolean; reason?: string }> => {
  printConsoleOtp(to, "Password Reset Request", otp, firstName);

  if (!hasRealSmtp || !transporter || !smtpUser) {
    console.warn(`[EMAIL SERVICE] Email not sent to ${to}: SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS on Railway.`);
    return { sent: false, reason: "SMTP simulated/unconfigured" };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your VARKA Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0c0907;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #ede4d8;
    }
    .email-container {
      max-width: 540px;
      margin: 30px auto;
      background: #171310;
      border: 1px solid #332821;
      padding: 40px 32px;
      border-radius: 4px;
    }
    .brand-header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #281f19;
      margin-bottom: 28px;
    }
    .brand-title {
      font-size: 24px;
      letter-spacing: 0.18em;
      font-weight: 700;
      color: #ede4d8;
      text-transform: uppercase;
      margin: 0 0 6px;
    }
    .brand-subtitle {
      font-size: 11px;
      letter-spacing: 0.12em;
      color: #c65d2c;
      text-transform: uppercase;
      margin: 0;
    }
    .greeting {
      font-size: 18px;
      margin: 0 0 16px;
      color: #ffffff;
    }
    .copy-text {
      font-size: 14px;
      line-height: 1.6;
      color: #b0a498;
      margin: 0 0 24px;
    }
    .otp-card {
      background: #0e0b09;
      border: 1px solid #c65d2c;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
      border-radius: 4px;
    }
    .otp-label {
      font-size: 11px;
      letter-spacing: 0.1em;
      color: #8c7e72;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 12px;
      color: #ede4d8;
      margin: 0;
      padding-left: 12px;
    }
    .expiry-note {
      font-size: 12px;
      color: #8c7e72;
      text-align: center;
      margin: 0 0 28px;
    }
    .security-notice {
      background: rgba(198, 93, 44, 0.08);
      border-left: 3px solid #c65d2c;
      padding: 12px 16px;
      font-size: 12px;
      line-height: 1.5;
      color: #b0a498;
      margin-bottom: 30px;
    }
    .footer {
      border-top: 1px solid #281f19;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #665b51;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="brand-header">
      <h1 class="brand-title">VARKA</h1>
      <p class="brand-subtitle">Password Recovery</p>
    </div>

    <p class="greeting">Hello ${firstName || "there"},</p>
    <p class="copy-text">
      We received a request to reset your VARKA account password. Please enter the recovery code below to proceed with setting a new password.
    </p>

    <div class="otp-card">
      <div class="otp-label">Password Reset Code</div>
      <div class="otp-code">${otp}</div>
    </div>

    <p class="expiry-note">
      ⏱️ This code will expire in <strong>15 minutes</strong>.
    </p>

    <div class="security-notice">
      <strong>Important:</strong> If you did not request a password reset, please change your password immediately or contact VARKA security.
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} VARKA Technologies Inc. All rights reserved.<br>
      Intelligent Freight Decision Engine.
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
VARKA — Password Recovery
Reset Code: ${otp}

Hello ${firstName || "there"},

We received a request to reset your VARKA password.
Use this 6-digit code to set a new password:
${otp}

This code expires in 15 minutes.
If you did not request this, please disregard.
© ${new Date().getFullYear()} VARKA Technologies Inc.
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: emailFrom || `VARKA <${smtpUser}>`,
      to,
      subject: `${otp} is your VARKA password reset code`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`✉️  [EMAIL SERVICE] Password reset email sent to ${to} (Message ID: ${info.messageId})`);
    return { sent: true };
  } catch (error: any) {
    console.error(`❌ [EMAIL SERVICE] Failed to send reset email to ${to}:`, error.message);
    return { sent: false, reason: error.message };
  }
};
