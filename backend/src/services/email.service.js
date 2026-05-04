const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send a welcome email when a user registers for the first time.
 */
const sendWelcomeEmail = async (toEmail, name) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Skipping welcome email.');
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"GeoGuard Security" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: '🎉 Welcome to GeoGuard!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🛡️ GeoGuard</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Real-Time Safety Intelligence Platform</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 30px;">
          <h2 style="color: #f1f5f9; margin: 0 0 16px; font-size: 22px;">Welcome aboard, ${name}! 👋</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
            Thank you for joining our community. With GeoGuard, you're now part of a network that keeps people safe in real-time.
          </p>

          <div style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #e2e8f0; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Here's what you can do:</p>
            <table style="width: 100%;">
              <tr><td style="padding: 6px 0; color: #94a3b8; font-size: 14px;">📍 Track incidents happening around you in real-time</td></tr>
              <tr><td style="padding: 6px 0; color: #94a3b8; font-size: 14px;">🗺️ Navigate using the safest routes</td></tr>
              <tr><td style="padding: 6px 0; color: #94a3b8; font-size: 14px;">🚨 Trigger SOS alerts to notify nearby users & contacts</td></tr>
              <tr><td style="padding: 6px 0; color: #94a3b8; font-size: 14px;">📰 Stay updated with local safety news</td></tr>
            </table>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">Open GeoGuard Dashboard</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; border-top: 1px solid rgba(148,163,184,0.1); text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">Stay safe 🛡️ — The GeoGuard Team</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending welcome email:', error.message);
  }
};

/**
 * Send a welcome-back email when an existing user logs in.
 */
const sendLoginEmail = async (toEmail, name) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Skipping login email.');
    return;
  }

  const transporter = createTransporter();

  const now = new Date();
  const loginTime = now.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const mailOptions = {
    from: `"GeoGuard Security" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: '🔐 Welcome back to GeoGuard!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🛡️ GeoGuard</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Real-Time Safety Intelligence Platform</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 30px;">
          <h2 style="color: #f1f5f9; margin: 0 0 16px; font-size: 22px;">Welcome back, ${name}! 🎉</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
            We noticed a new login to your GeoGuard account. Here are the details:
          </p>

          <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 120px;">🕐 Login Time</td>
                <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; font-weight: 500;">${loginTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">📧 Account</td>
                <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; font-weight: 500;">${toEmail}</td>
              </tr>
            </table>
          </div>

          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            If this was you, no further action is needed. If you did not log in, please secure your account immediately.
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">Go to Dashboard</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; border-top: 1px solid rgba(148,163,184,0.1); text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">Stay safe 🛡️ — The GeoGuard Team</p>
          <p style="color: #475569; font-size: 11px; margin: 8px 0 0;">This is an automated security notification.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Login welcome email sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending login email:', error.message);
  }
};

/**
 * Send an OTP verification email for account registration.
 */
const sendVerificationEmail = async (toEmail, otp) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Skipping verification email.');
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"GeoGuard Security" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: '🔐 Verify your GeoGuard Account',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🛡️ GeoGuard</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Account Verification</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 30px;">
          <h2 style="color: #f1f5f9; margin: 0 0 16px; font-size: 22px;">Verify your email address</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
            Please use the following 6-digit code to complete your registration. This code will expire in 10 minutes.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background: rgba(245,158,11,0.1); border: 2px dashed rgba(245,158,11,0.5); padding: 16px 32px; border-radius: 12px;">
              <span style="color: #f59e0b; font-size: 32px; font-weight: 800; letter-spacing: 6px;">${otp}</span>
            </div>
          </div>

          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
            If you did not request this code, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; border-top: 1px solid rgba(148,163,184,0.1); text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">Stay safe 🛡️ — The GeoGuard Team</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending verification email:', error.message);
    throw error;
  }
};

module.exports = { sendWelcomeEmail, sendLoginEmail, sendVerificationEmail };
