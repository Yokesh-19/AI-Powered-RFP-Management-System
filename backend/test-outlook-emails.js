require('dotenv').config();
const sgMail = require('@sendgrid/mail');

console.log('=== Testing Outlook Email Delivery ===\n');

async function testOutlookEmails() {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const emails = ['yokeshapp@outlook.com', 'yokeshapp2@outlook.com'];
    
    for (const email of emails) {
      console.log(`Sending to: ${email}...`);
      
      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        replyTo: process.env.GMAIL_USER,
        subject: 'RFP: Test Equipment Request',
        html: `
          <h2>Request for Proposal: Test Equipment</h2>
          <p>Dear Vendor,</p>
          <p>This is a test RFP email.</p>
          <h3>Items Requested:</h3>
          <ul>
            <li>50 Office Chairs</li>
            <li>10 Standing Desks</li>
            <li>25 Desk Lamps</li>
          </ul>
          <p>Budget: $35,000</p>
          <p>Please reply with your proposal.</p>
        `,
      };

      const response = await sgMail.send(msg);
      console.log(`✅ SUCCESS - Status: ${response[0].statusCode}`);
      console.log(`   Message ID: ${response[0].headers['x-message-id']}\n`);
    }
    
    console.log('✅ All test emails sent!');
    console.log('\nCheck both Outlook inboxes:');
    console.log('1. yokeshapp@outlook.com');
    console.log('2. yokeshapp2@outlook.com');
    console.log('\nLook in: Inbox, Junk, or Deleted folders');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Details:', JSON.stringify(error.response.body, null, 2));
    }
  }
}

testOutlookEmails();
