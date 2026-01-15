require('dotenv').config();
const sgMail = require('@sendgrid/mail');

console.log('=== Testing Email to Your Own Account ===\n');

async function testSelfEmail() {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: 'yokipers@gmail.com', // Send to yourself
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: '🔔 RFP System Test - Check if You Receive This',
      html: `
        <h1>✅ Email Delivery Test</h1>
        <p>If you receive this email, SendGrid is working correctly!</p>
        <p><strong>Time sent:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p>This confirms:</p>
        <ul>
          <li>✅ SendGrid API is configured</li>
          <li>✅ Sender email is verified</li>
          <li>✅ Emails are being delivered</li>
        </ul>
        <p><strong>Next step:</strong> Check why emails to yokeshm.dev@gmail.com and yyokesh2004@gmail.com are not arriving.</p>
      `,
    };

    console.log('Sending test email to: yokipers@gmail.com');
    const response = await sgMail.send(msg);
    console.log(`✅ SUCCESS - Status: ${response[0].statusCode}`);
    console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
    console.log('\n📧 Check yokipers@gmail.com inbox NOW');
    console.log('   - Primary inbox');
    console.log('   - Spam folder');
    console.log('   - All Mail');
    console.log('\nIf you receive this email, the problem is with the recipient addresses.');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
  }
}

testSelfEmail();
