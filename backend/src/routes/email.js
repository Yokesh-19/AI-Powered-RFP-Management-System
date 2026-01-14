const express = require('express');
const multer = require('multer');
const { getDB } = require('../utils/database');
const { AIService } = require('../services/aiService');
const { ObjectId } = require('mongodb');

const router = express.Router();
const upload = multer();

/**
 * SendGrid Inbound Parse Webhook
 * Receives emails sent to your domain and automatically creates proposals
 * 
 * Setup Instructions:
 * 1. Go to SendGrid → Settings → Inbound Parse
 * 2. Add your domain or use SendGrid subdomain
 * 3. Set webhook URL: https://your-domain.com/api/email/receive
 * 4. Vendors reply to RFP emails → SendGrid forwards to this endpoint
 */
router.post('/receive', upload.none(), async (req, res) => {
  try {
    console.log('📧 Received inbound email from SendGrid');
    
    const { from, to, subject, text, html } = req.body;
    
    if (!from || !text) {
      console.log('❌ Invalid email data');
      return res.status(400).json({ error: 'Invalid email data' });
    }

    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);

    const db = getDB();

    // Extract vendor email from "from" field
    const emailMatch = from.match(/<(.+?)>/) || [null, from];
    const vendorEmail = emailMatch[1].toLowerCase().trim();

    // Find vendor by email
    const vendor = await db.collection('vendors').findOne({ 
      email: { $regex: new RegExp(vendorEmail, 'i') }
    });

    if (!vendor) {
      console.log(`⚠️ Vendor not found for email: ${vendorEmail}`);
      return res.status(200).json({ 
        message: 'Email received but vendor not found',
        suggestion: 'Add vendor to system first'
      });
    }

    // Extract RFP ID from subject or email thread
    // Format: "RFP: Title" or "Re: RFP: Title" or contains RFP ID
    let rfpId = null;
    
    // Try to find RFP from recent sent RFPs to this vendor
    const recentRFPs = await db.collection('rfp_vendors').find({
      vendorId: vendor._id.toString(),
      sentAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).sort({ sentAt: -1 }).limit(1).toArray();

    if (recentRFPs.length > 0) {
      rfpId = recentRFPs[0].rfpId;
    }

    if (!rfpId) {
      console.log('⚠️ Could not determine RFP for this email');
      return res.status(200).json({ 
        message: 'Email received but could not match to RFP',
        suggestion: 'Ensure vendor was sent an RFP recently'
      });
    }

    // Check if proposal already exists
    const existingProposal = await db.collection('proposals').findOne({
      rfpId,
      vendorId: vendor._id.toString()
    });

    if (existingProposal) {
      console.log('⚠️ Proposal already exists, updating...');
      // Update existing proposal
      const rfp = await db.collection('rfps').findOne({ _id: new ObjectId(rfpId) });
      const parsedData = await AIService.parseProposalEmail(text || html, rfp);
      
      let status = 'PARSED';
      if (parsedData.parseError === 'NO_CONTENT') status = 'ERROR';
      else if (parsedData.parseError === 'INSUFFICIENT_DATA' || !parsedData.isComplete) status = 'INCOMPLETE';

      await db.collection('proposals').updateOne(
        { _id: existingProposal._id },
        {
          $set: {
            rawContent: text || html,
            totalPrice: parsedData.totalPrice,
            itemPrices: parsedData.itemPrices,
            deliveryDate: parsedData.deliveryDate ? new Date(parsedData.deliveryDate) : null,
            warranty: parsedData.warranty,
            terms: parsedData.terms,
            aiSummary: parsedData.summary,
            isComplete: parsedData.isComplete,
            status,
            updatedAt: new Date(),
            receivedViaEmail: true
          }
        }
      );

      console.log('✅ Proposal updated from email');
      return res.status(200).json({ message: 'Proposal updated successfully' });
    }

    // Create new proposal
    const rfp = await db.collection('rfps').findOne({ _id: new ObjectId(rfpId) });
    
    if (!rfp) {
      console.log('❌ RFP not found');
      return res.status(200).json({ message: 'RFP not found' });
    }

    console.log('🤖 Parsing email with AI...');
    const parsedData = await AIService.parseProposalEmail(text || html, rfp);
    
    let status = 'PARSED';
    if (parsedData.parseError === 'NO_CONTENT') status = 'ERROR';
    else if (parsedData.parseError === 'INSUFFICIENT_DATA' || !parsedData.isComplete) status = 'INCOMPLETE';

    const proposal = {
      rfpId,
      vendorId: vendor._id.toString(),
      rawContent: text || html,
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
      emailFrom: from,
      emailSubject: subject
    };

    await db.collection('proposals').insertOne(proposal);

    console.log('✅ Proposal created from email successfully');
    res.status(200).json({ message: 'Proposal received and parsed successfully' });

  } catch (error) {
    console.error('❌ Error processing inbound email:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
});

/**
 * Manual email check endpoint (alternative to webhook)
 * For testing: POST with email content directly
 */
router.post('/manual-receive', async (req, res) => {
  try {
    const { vendorEmail, rfpId, emailContent } = req.body;

    if (!vendorEmail || !rfpId || !emailContent) {
      return res.status(400).json({ 
        error: 'Missing required fields: vendorEmail, rfpId, emailContent' 
      });
    }

    const db = getDB();

    // Find vendor
    const vendor = await db.collection('vendors').findOne({ 
      email: { $regex: new RegExp(vendorEmail, 'i') }
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Find RFP
    const rfp = await db.collection('rfps').findOne({ _id: new ObjectId(rfpId) });
    
    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    // Check for existing proposal
    const existingProposal = await db.collection('proposals').findOne({
      rfpId,
      vendorId: vendor._id.toString()
    });

    if (existingProposal) {
      return res.status(400).json({ 
        error: 'Proposal already exists',
        proposalId: existingProposal._id.toString()
      });
    }

    // Parse email
    const parsedData = await AIService.parseProposalEmail(emailContent, rfp);
    
    let status = 'PARSED';
    if (parsedData.parseError === 'NO_CONTENT') status = 'ERROR';
    else if (parsedData.parseError === 'INSUFFICIENT_DATA' || !parsedData.isComplete) status = 'INCOMPLETE';

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
      receivedViaEmail: true
    };

    const result = await db.collection('proposals').insertOne(proposal);
    proposal.id = result.insertedId.toString();

    res.status(201).json({ 
      message: 'Email received and parsed successfully',
      proposal 
    });

  } catch (error) {
    console.error('Error processing manual email:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
});

module.exports = router;
