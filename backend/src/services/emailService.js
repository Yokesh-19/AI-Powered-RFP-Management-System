const sgMail = require('@sendgrid/mail');

class EmailService {
  static init() {
    console.log('🔍 Checking SendGrid configuration...');
    console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
    console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
    
    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here' || process.env.SENDGRID_API_KEY === 'REPLACE_WITH_YOUR_SENDGRID_API_KEY') {
      throw new Error('EMAIL_CONFIG_ERROR: SENDGRID_API_KEY is required. Please configure it in .env file.');
    }
    if (!process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL === 'your_email@domain.com' || process.env.SENDGRID_FROM_EMAIL === 'REPLACE_WITH_YOUR_VERIFIED_EMAIL@domain.com') {
      throw new Error('EMAIL_CONFIG_ERROR: SENDGRID_FROM_EMAIL is required. Please configure it in .env file.');
    }
    
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log('✅ SendGrid email service initialized');
      return true;
    } catch (error) {
      throw new Error(`EMAIL_CONFIG_ERROR: Failed to initialize SendGrid - ${error.message}`);
    }
  }

  static async sendRFPToVendor(rfp, vendor) {
    try {
      this.init(); // Ensure SendGrid is configured
      
      const emailContent = this.generateRFPEmail(rfp);
      
      const msg = {
        to: vendor.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `RFP: ${rfp.title}`,
        html: emailContent,
      };

      await sgMail.send(msg);
      console.log(`📧 Email sent to ${vendor.name} (${vendor.email})`);
      return { success: true, method: 'email', vendor: vendor.name };
    } catch (error) {
      console.error(`❌ Email send failed for ${vendor.name}:`, error.message);
      
      // Categorize error types for better user feedback
      let errorType = 'EMAIL_ERROR';
      let userMessage = error.message;
      
      if (error.code === 401 || error.message.includes('Unauthorized') || error.message.includes('API key')) {
        errorType = 'AUTH_ERROR';
        userMessage = 'Invalid SendGrid API key. Please verify your configuration.';
      } else if (error.code === 403 || error.message.includes('Forbidden')) {
        errorType = 'AUTH_ERROR';
        userMessage = 'SendGrid API key does not have permission to send emails.';
      } else if (error.message.includes('from email') || error.message.includes('sender')) {
        errorType = 'SENDER_ERROR';
        userMessage = 'Sender email not verified in SendGrid. Please verify your email address.';
      } else if (error.message.includes('recipient') || error.message.includes('to email')) {
        errorType = 'RECIPIENT_ERROR';
        userMessage = `Invalid recipient email address: ${vendor.email}`;
      } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
        errorType = 'NETWORK_ERROR';
        userMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('EMAIL_CONFIG_ERROR')) {
        errorType = 'CONFIG_ERROR';
        userMessage = error.message.replace('EMAIL_CONFIG_ERROR: ', '');
      }
      
      return { 
        success: false, 
        method: 'email', 
        vendor: vendor.name,
        error: userMessage,
        errorType: errorType,
        technicalDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  static generateRFPEmail(rfp) {
    const itemsTable = rfp.items.map(item => 
      `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.specifications || 'N/A'}</td></tr>`
    ).join('');

    return `
      <html><body style="font-family: Arial, sans-serif;">
        <h2>Request for Proposal: ${rfp.title}</h2>
        <p>Dear Vendor,</p>
        <p>We are requesting proposals for: ${rfp.description}</p>
        
        <h3>Items Requested:</h3>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr><th>Item</th><th>Quantity</th><th>Specifications</th></tr>
          ${itemsTable}
        </table>
        
        <h3>Requirements:</h3>
        <ul>
          ${rfp.budget ? `<li>Budget: $${rfp.budget.toLocaleString()}</li>` : ''}
          ${rfp.deliveryDate ? `<li>Delivery: ${new Date(rfp.deliveryDate).toLocaleDateString()}</li>` : ''}
          ${rfp.paymentTerms ? `<li>Payment Terms: ${rfp.paymentTerms}</li>` : ''}
        </ul>
        
        <p>Please reply with your proposal including pricing, delivery timeline, and terms.</p>
        <p>Best regards,<br>Procurement Team</p>
      </body></html>
    `;
  }
}

module.exports = { EmailService };