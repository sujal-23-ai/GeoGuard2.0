require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('--- SMTP Debug ---');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? `"${process.env.SMTP_PASS}" (${process.env.SMTP_PASS.length} chars)` : 'NOT SET');
console.log('---');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// First verify the connection
transporter.verify()
  .then(() => {
    console.log('✅ SMTP connection verified successfully!');
    // Now send a test email
    return transporter.sendMail({
      from: `"GeoGuard Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // send to yourself
      subject: 'GeoGuard SMTP Test',
      text: 'If you received this, SMTP is working!',
    });
  })
  .then((info) => {
    console.log('✅ Test email sent!', info.messageId);
  })
  .catch((err) => {
    console.error('❌ SMTP Error:', err.message);
    console.error('Full error:', err);
  });
