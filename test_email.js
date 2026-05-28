const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Z01'}" <${process.env.FROM_EMAIL}>`,
      to: process.env.SMTP_USER, // Send to self
      subject: 'Z01 SMTP Test',
      text: 'If you are reading this, your SMTP settings are working correctly!',
    });
    console.log('Test email sent: %s', info.messageId);
  } catch (error) {
    console.error('Test email failed:', error);
  }
}

testEmail();
