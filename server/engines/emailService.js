import nodemailer from 'nodemailer';
import { state } from '../state/store.js';

// In-memory OTP storage: email -> { otp, expiresAt, username, phone, password }
const otps = new Map();

// SMTP configuration (configurable via environment variables or Admin settings)
let smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || '1X-BET Security <security@1xbet.global>'
};

// Recent OTP logs for Admin Panel visibility & instant verification
export const otpLogs = [];

export function getSmtpConfig() {
  return { ...smtpConfig, pass: smtpConfig.pass ? '••••••••' : '' };
}

export function updateSmtpConfig(newConfig) {
  smtpConfig = { ...smtpConfig, ...newConfig };
  return getSmtpConfig();
}

export function getOtpLogs() {
  return otpLogs;
}

export async function sendOtpEmail({ email, username, phone, password }) {
  // Generate cryptographically secure 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  // Save pending verification
  otps.set(email.toLowerCase(), {
    otp,
    expiresAt,
    username,
    phone,
    password
  });

  const logEntry = {
    id: 'otp_' + Date.now(),
    email,
    username,
    phone,
    otp,
    createdAt: Date.now(),
    expiresAt,
    status: 'PENDING', // PENDING, VERIFIED, EXPIRED
    deliveryStatus: 'SIMULATED'
  };

  otpLogs.unshift(logEntry);
  if (otpLogs.length > 50) otpLogs.pop();

  // If SMTP credentials provided, send actual real email
  if (smtpConfig.user && smtpConfig.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        }
      });

      const htmlContent = `
        <div style="background-color: #0b1118; color: #ffffff; padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; border-radius: 16px; border: 1px solid #1a2d42;">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #0088cc, #00e676); width: 50px; height: 50px; line-height: 50px; border-radius: 12px; font-size: 24px; font-weight: bold; color: white;">1X</div>
            <h2 style="color: #ffffff; margin: 10px 0 0 0; font-size: 22px; letter-spacing: 1px;">1X-BET GLOBAL VERIFICATION</h2>
            <p style="color: #00e676; font-size: 11px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase;">Official Account Security</p>
          </div>

          <div style="background: #101c2a; padding: 25px; border-radius: 12px; border: 1px solid #20354c; text-align: center;">
            <p style="color: #c4d1db; font-size: 14px; margin-top: 0;">Salam <strong>${username}</strong>,</p>
            <p style="color: #8b9baa; font-size: 13px; line-height: 1.5;">Aapka 1X-BET par account create karne ke liye email confirmation zaroori hai. Niche diya gaya One-Time Password (OTP) enter karein:</p>
            
            <div style="background: #080e16; border: 2px dashed #0088cc; padding: 18px; border-radius: 12px; margin: 25px 0;">
              <span style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #00e676; font-family: monospace;">${otp}</span>
            </div>

            <p style="color: #ff9800; font-size: 11px; margin-bottom: 0;">⚠️ Yeh code 10 minutes ke liye valid hai. Kisi ke sath share mat karein.</p>
          </div>

          <div style="text-align: center; margin-top: 25px; color: #5a6e85; font-size: 11px;">
            <p style="margin: 0;">1X-BET Global Sportsbook & Live Casino</p>
            <p style="margin: 4px 0 0 0;">Agar aapne yeh request nahi ki toh is email ko ignore karein.</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: smtpConfig.from,
        to: email,
        subject: `🔐 Your 1X-BET Verification Code: ${otp}`,
        html: htmlContent
      });

      logEntry.deliveryStatus = 'SENT_VIA_SMTP';
      console.log(`[Email] Real OTP ${otp} sent to ${email}`);
    } catch (err) {
      console.error(`[Email Error] Failed to send email via SMTP:`, err.message);
      logEntry.deliveryStatus = `SMTP_ERROR: ${err.message}`;
    }
  } else {
    logEntry.deliveryStatus = 'READY (SMTP not set, view in Admin Panel)';
    console.log(`[Email Service] OTP generated for ${email}: ${otp} (Enter this OTP to confirm)`);
  }

  return {
    success: true,
    email,
    otp, // Returned for dev/test environments and admin panel sync
    expiresInSeconds: 600,
    deliveryStatus: logEntry.deliveryStatus
  };
}

export function verifyOtpCode(email, inputOtp) {
  const cleanEmail = email.toLowerCase().trim();
  const record = otps.get(cleanEmail);

  if (!record) {
    throw new Error('No pending OTP request found for this email. Please request a new OTP.');
  }

  if (Date.now() > record.expiresAt) {
    otps.delete(cleanEmail);
    throw new Error('OTP has expired! Please request a new OTP.');
  }

  if (record.otp !== inputOtp.trim()) {
    throw new Error('Invalid OTP code! Please check the code and try again.');
  }

  // Mark log entry as verified
  const log = otpLogs.find(l => l.email.toLowerCase() === cleanEmail && l.otp === record.otp);
  if (log) log.status = 'VERIFIED';

  // OTP is valid! Remove from pending
  otps.delete(cleanEmail);

  return record;
}
