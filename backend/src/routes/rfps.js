const express = require('express');
const { ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator');
const { AIService } = require('../services/aiService');
const { EmailService } = require('../services/emailService');
const { getDB } = require('../utils/database');

const router = express.Router();

// Create RFP from natural language
router.post('/', 
  body('description').notEmpty().withMessage('Description is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description } = req.body;

      // Use AI to parse natural language into structured data
      let structuredRFP;
      try {
        structuredRFP = await AIService.parseNaturalLanguageToRFP(description);
      } catch (aiError) {
        console.error('AI parsing error:', aiError.message);
        return res.status(503).json({ 
          error: 'AI service temporarily unavailable. Please try again or contact support.',
          details: process.env.NODE_ENV === 'development' ? aiError.message : undefined
        });
      }

      // Save to database
      const db = getDB();
      const rfp = {
        title: structuredRFP.title,
        description: structuredRFP.description,
        items: structuredRFP.items,
        budget: structuredRFP.budget,
        deliveryDate: structuredRFP.deliveryDate ? new Date(structuredRFP.deliveryDate) : null,
        paymentTerms: structuredRFP.paymentTerms,
        requirements: structuredRFP.requirements,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('rfps').insertOne(rfp);
      rfp._id = result.insertedId;

      res.status(201).json(rfp);
    } catch (error) {
      console.error('Error creating RFP:', error);
      
      let errorMessage = 'Failed to create RFP';
      if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error. Please check your API key.';
      }
      
      res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get all RFPs
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const rfps = await db.collection('rfps').find({}).sort({ createdAt: -1 }).toArray();

    // Add empty arrays for proposals and rfpVendors for compatibility
    const rfpsWithRelations = rfps.map(rfp => ({
      ...rfp,
      id: rfp._id.toString(),
      proposals: [],
      rfpVendors: []
    }));

    res.json(rfpsWithRelations);
  } catch (error) {
    console.error('Error fetching RFPs:', error);
    res.status(500).json({ error: 'Failed to fetch RFPs' });
  }
});

// Get specific RFP
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching RFP with ID:', id);
    const db = getDB();
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ error: 'Invalid RFP ID format' });
    }
    
    const rfp = await db.collection('rfps').findOne({ _id: new ObjectId(id) });
    console.log('Found RFP:', rfp ? 'Yes' : 'No');

    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    // Add empty arrays for compatibility
    rfp.id = rfp._id.toString();
    rfp.proposals = [];
    rfp.rfpVendors = [];

    res.json(rfp);
  } catch (error) {
    console.error('Error fetching RFP:', error);
    res.status(500).json({ error: 'Failed to fetch RFP' });
  }
});

// Send RFP to vendors
router.post('/:id/send',
  body('vendorIds').isArray().withMessage('vendorIds must be an array'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { vendorIds } = req.body;
      const db = getDB();

      // Validate ObjectId format
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid RFP ID format' });
      }

      // Get RFP details
      const rfp = await db.collection('rfps').findOne({ _id: new ObjectId(id) });
      if (!rfp) {
        return res.status(404).json({ error: 'RFP not found' });
      }

      // Get vendor details
      const vendors = await db.collection('vendors').find({
        _id: { $in: vendorIds.map(vid => new ObjectId(vid)) }
      }).toArray();

      // Send emails to vendors
      const emailResults = [];
      let successCount = 0;
      let failCount = 0;
      
      for (const vendor of vendors) {
        try {
          const result = await EmailService.sendRFPToVendor(rfp, vendor);
          emailResults.push(result);
          if (result.success) successCount++;
          else failCount++;
        } catch (error) {
          console.error(`Failed to send to ${vendor.name}:`, error.message);
          emailResults.push({ 
            success: false, 
            vendor: vendor.name, 
            error: error.message 
          });
          failCount++;
        }
      }

      // Create RFPVendor records
      const rfpVendorData = vendorIds.map(vendorId => ({
        rfpId: id,
        vendorId,
        sentAt: new Date()
      }));

      await db.collection('rfp_vendors').insertMany(rfpVendorData);

      // Update RFP status
      await db.collection('rfps').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'SENT', updatedAt: new Date() } }
      );

      res.json({ 
        message: successCount > 0 ? 
          `RFP sent successfully to ${successCount} vendor(s)${failCount > 0 ? `, ${failCount} failed` : ''}` :
          'Failed to send RFP to all vendors',
        vendorCount: vendors.length,
        successCount,
        failCount,
        emailResults 
      });
    } catch (error) {
      console.error('Error sending RFP:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to send RFP';
      if (error.message.includes('SENDGRID')) {
        errorMessage = 'Email service configuration error. Please check SendGrid settings.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'Invalid email API key. Please verify your SendGrid configuration.';
      }
      
      res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Delete RFP
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid RFP ID format' });
    }

    // Delete RFP and related data
    await db.collection('rfps').deleteOne({ _id: new ObjectId(id) });
    await db.collection('proposals').deleteMany({ rfpId: id });
    await db.collection('rfp_vendors').deleteMany({ rfpId: id });

    res.json({ message: 'RFP deleted successfully' });
  } catch (error) {
    console.error('Error deleting RFP:', error);
    res.status(500).json({ error: 'Failed to delete RFP' });
  }
});

module.exports = router;