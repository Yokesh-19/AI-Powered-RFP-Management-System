require('dotenv').config();
const sgMail = require('@sendgrid/mail');

console.log('=== SendGrid Email Test ===\n');
console.log('API Key:', process.env.SENDGRID_API_KEY ? `${process.env.SENDGRID_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('From Email:', process.env.SENDGRID_FROM_EMAIL);
console.log('');

async function testEmail() {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const testEmails = ['yokeshm.dev@gmail.com', 'yyokesh2004@gmail.com'];
    
    for (const email of testEmails) {
      console.log(`Sending test to: ${email}...`);
      
      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Test Email from RFP System',
        html: '<h1>Test Email</h1><p>If you receive this, email sending is working!</p>',
      };

      const response = await sgMail.send(msg);
      console.log(`✅ SUCCESS - Status: ${response[0].statusCode}`);
      console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
      console.log('');
    }
    
    console.log('✅ All emails sent successfully!');
    console.log('\nCheck:');
    console.log('1. Inbox (may take 1-2 minutes)');
    console.log('2. Spam/Junk folder');
    console.log('3. SendGrid Activity: https://app.sendgrid.com/email_activity');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  }
}

testEmail();
