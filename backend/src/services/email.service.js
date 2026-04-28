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

const sendWelcomeEmail = async (toEmail, name) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Skipping welcome email.');
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"GeoGuard Security" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Welcome to GeoGuard!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #3b82f6;">Welcome to GeoGuard, ${name}!</h2>
        <p>Thank you for joining our real-time safety intelligence platform.</p>
        <p>With GeoGuard, you can:</p>
        <ul>
          <li>Stay informed about incidents happening around you in real-time.</li>
          <li>Find the safest routes for your commute.</li>
          <li>Help your community by reporting hazards.</li>
        </ul>
        <br/>
        <p>Stay safe,<br/><strong>The GeoGuard Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

module.exports = { sendWelcomeEmail };
