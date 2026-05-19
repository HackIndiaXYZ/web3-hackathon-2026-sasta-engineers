import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  provider: process.env.EMAIL_PROVIDER || 'sendgrid', // 'sendgrid', 'ses', 'smtp'
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  from: process.env.EMAIL_FROM || 'noreply@chaincred.com',
  fromName: process.env.EMAIL_FROM_NAME || 'ChainCred',
}));
