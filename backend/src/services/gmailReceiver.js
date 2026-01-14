const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { getDB } = require('../utils/database');
const { AIService } = require('./aiService');
const { ObjectId } = require('mongodb');

class GmailReceiver {
  constructor() {
    this.imap = null;
    this.isConnected = false;
  }

  /**
   * Initialize IMAP connection to Gmail
   * Requires Gmail App Password (not regular password)
   */
  connect() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    }

    this.imap = new Imap({
      user: process.env.GMAIL_USER,
      password: process.env.GMAIL_APP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('✅ Connected to Gmail IMAP');
        this.isConnected = true;
        resolve();
      });

      this.imap.once('error', (err) => {
        console.error('❌ IMAP connection error:', err);
        this.isConnected = false;
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('📪 IMAP connection ended');
        this.isConnected = false;
      });

      this.imap.connect();
    });
  }

  /**
   * Check for new vendor reply emails
   * Looks for emails with "Re: RFP" in subject
   */
  async checkNewEmails() {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for unread emails with "RFP" in subject
        this.imap.search(['UNSEEN', ['SUBJECT', 'RFP']], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            console.log('📭 No new vendor emails found');
            resolve([]);
            return;
          }

          console.log(`📬 Found ${results.length} new vendor email(s)`);

          const fetch = this.imap.fetch(results, { bodies: '', markSeen: true });
          const emails = [];

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('Error parsing email:', err);
                  return;
                }

                emails.push({
                  from: parsed.from.text,
                  to: parsed.to.text,
                  subject: parsed.subject,
                  text: parsed.text,
                  html: parsed.html,
                  date: parsed.date
                });
              });
            });
          });

          fetch.once('error', reject);

          fetch.once('end', () => {
            resolve(emails);
          });
        });
      });
    });
  }

  /**
   * Process vendor email and create proposal
   */
  async processVendorEmail(email) {
    try {
      const db = getDB();

      // Extract vendor email
      const emailMatch = email.from.match(/<(.+?)>/) || [null, email.from];
      const vendorEmail = emailMatch[1].toLowerCase().trim();

      console.log(`📧 Processing email from: ${vendorEmail}`);

      // Find vendor
      const vendor = await db.collection('vendors').findOne({
        email: { $regex: new RegExp(vendorEmail, 'i') }
      });

      if (!vendor) {
        console.log(`⚠️ Vendor not found: ${vendorEmail}`);
        return { success: false, reason: 'Vendor not found' };
      }

      // Find recent RFP sent to this vendor
      const recentRFPs = await db.collection('rfp_vendors').find({
        vendorId: vendor._id.toString(),
        sentAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).sort({ sentAt: -1 }).limit(1).toArray();

      if (recentRFPs.length === 0) {
        console.log(`⚠️ No recent RFP found for vendor: ${vendor.name}`);
        return { success: false, reason: 'No recent RFP' };
      }

      const rfpId = recentRFPs[0].rfpId;

      // Check if proposal already exists
      const existingProposal = await db.collection('proposals').findOne({
        rfpId,
        vendorId: vendor._id.toString()
      });

      if (existingProposal) {
        console.log(`⚠️ Proposal already exists for ${vendor.name}`);
        return { success: false, reason: 'Proposal already exists' };
      }

      // Get RFP context
      const rfp = await db.collection('rfps').findOne({ _id: new ObjectId(rfpId) });

      if (!rfp) {
        console.log(`❌ RFP not found: ${rfpId}`);
        return { success: false, reason: 'RFP not found' };
      }

      // Parse email with AI
      const emailContent = email.text || email.html;
      console.log('🤖 Parsing email with AI...');
      const parsedData = await AIService.parseProposalEmail(emailContent, rfp);

      let status = 'PARSED';
      if (parsedData.parseError === 'NO_CONTENT') status = 'ERROR';
      else if (parsedData.parseError === 'INSUFFICIENT_DATA' || !parsedData.isComplete) status = 'INCOMPLETE';

      // Create proposal
      const proposal = {
        rfpId,
        vendorId: vendor._id.toString(),
        rawContent: emailContent,
        totalPrice: parsedData.totalPrice,
        itemPrices: parsedData.itemPrices,
        deliveryDate: parsedData.deliveryDate ? new Date(parsedData.deliveryDate) : null,
        warranty: parsedData.warranty,
        terms: parsedData.terms,
        aiSummary: parsedData.summary,
        isComplete: parsedData.isComplete,
        parseError: parsedData.parseError,
        status,
        receivedAt: new Date(),
        receivedViaEmail: true,
        emailFrom: email.from,
        emailSubject: email.subject
      };

      await db.collection('proposals').insertOne(proposal);

      console.log(`✅ Proposal created for ${vendor.name}`);
      return { success: true, vendor: vendor.name, rfpId };

    } catch (error) {
      console.error('❌ Error processing email:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Main polling function - checks for new emails periodically
   */
  async pollEmails() {
    try {
      const emails = await this.checkNewEmails();

      for (const email of emails) {
        await this.processVendorEmail(email);
      }

      return emails.length;
    } catch (error) {
      console.error('Error polling emails:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.imap) {
      this.imap.end();
    }
  }
}

module.exports = { GmailReceiver };
