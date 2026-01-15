require('dotenv').config();
const https = require('https');

console.log('=== SendGrid Configuration Check ===\n');

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

console.log('API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : '❌ NOT SET');
console.log('From Email:', fromEmail || '❌ NOT SET');
console.log('');

if (!apiKey || !fromEmail) {
  console.error('❌ Missing configuration in .env file');
  process.exit(1);
}

// Check API key validity
const options = {
  hostname: 'api.sendgrid.com',
  path: '/v3/scopes',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
};

console.log('Checking API key validity...');
const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ API Key is VALID');
      const scopes = JSON.parse(data).scopes;
      console.log(`   Permissions: ${scopes.length} scopes`);
      
      if (scopes.includes('mail.send')) {
        console.log('   ✅ Has mail.send permission');
      } else {
        console.log('   ❌ Missing mail.send permission');
      }
      
      console.log('\n📋 Next Steps:');
      console.log('1. Verify sender email in SendGrid:');
      console.log('   https://app.sendgrid.com/settings/sender_auth/senders');
      console.log(`   Make sure ${fromEmail} is verified (green checkmark)`);
      console.log('');
      console.log('2. Run test email:');
      console.log('   node test-email-direct.js');
      console.log('');
      console.log('3. Check email activity:');
      console.log('   https://app.sendgrid.com/email_activity');
      
    } else if (res.statusCode === 401) {
      console.log('❌ API Key is INVALID or EXPIRED');
      console.log('   Generate new key: https://app.sendgrid.com/settings/api_keys');
    } else {
      console.log(`❌ Error: Status ${res.statusCode}`);
      console.log('   Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network error:', error.message);
});

req.end();
