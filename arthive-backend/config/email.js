const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Admin email address
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'arthive231@gmail.com';

module.exports = {
  createTransporter,
  ADMIN_EMAIL
};
