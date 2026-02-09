// Test email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
  console.log('📧 Testing email configuration...\n');
  
  console.log('Environment variables:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***set***' : 'NOT SET');
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
  console.log('');

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log('🔍 Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Send test email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"ArtHive Test" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email from ArtHive Backend',
      text: 'This is a test email to verify email configuration is working.',
      html: '<h2>✅ Email Configuration Working!</h2><p>This is a test email from ArtHive backend.</p>'
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('');
    console.log('🎉 Email setup is working correctly!');
    console.log('Check your inbox at:', process.env.ADMIN_EMAIL);
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error:', error.message);
    console.log('');
    
    if (error.message.includes('Invalid login')) {
      console.log('💡 Solution:');
      console.log('1. Go to Google Account settings: https://myaccount.google.com/');
      console.log('2. Enable 2-Step Verification');
      console.log('3. Go to Security > App passwords');
      console.log('4. Generate an App Password for "Mail"');
      console.log('5. Update EMAIL_PASSWORD in .env with the 16-character App Password');
      console.log('6. Remove all spaces from the App Password');
    }
  }
};

testEmail();
