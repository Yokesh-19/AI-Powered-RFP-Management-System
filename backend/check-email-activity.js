require('dotenv').config();
const https = require('https');

console.log('=== SendGrid Email Activity Check ===\n');

const apiKey = process.env.SENDGRID_API_KEY;

// Get recent email activity
const options = {
  hostname: 'api.sendgrid.com',
  path: '/v3/messages?limit=10',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
};

console.log('Fetching recent email activity...\n');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const messages = JSON.parse(data).messages || [];
      
      if (messages.length === 0) {
        console.log('❌ No recent email activity found');
        console.log('\nPossible reasons:');
        console.log('1. Emails are still being processed (wait 1-2 minutes)');
        console.log('2. SendGrid activity API has delay');
        console.log('3. Check web dashboard: https://app.sendgrid.com/email_activity');
      } else {
        console.log(`✅ Found ${messages.length} recent emails:\n`);
        
        messages.forEach((msg, i) => {
          console.log(`Email ${i + 1}:`);
          console.log(`  To: ${msg.to_email}`);
          console.log(`  From: ${msg.from_email}`);
          console.log(`  Subject: ${msg.subject}`);
          console.log(`  Status: ${msg.status}`);
          console.log(`  Last Event: ${msg.last_event_time}`);
          console.log('');
        });
      }
      
      console.log('\n📊 Check detailed activity:');
      console.log('https://app.sendgrid.com/email_activity');
      console.log('\nSearch for emails to:');
      console.log('- yokeshm.dev@gmail.com');
      console.log('- yyokesh2004@gmail.com');
      
    } else {
      console.log(`❌ API Error: Status ${res.statusCode}`);
      console.log('Response:', data);
      console.log('\n💡 Use web dashboard instead:');
      console.log('https://app.sendgrid.com/email_activity');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network error:', error.message);
  console.log('\n💡 Check web dashboard:');
  console.log('https://app.sendgrid.com/email_activity');
});

req.end();
