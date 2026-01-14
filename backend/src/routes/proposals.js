const express = require('express');
const { ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator');
const { AIService } = require('../services/aiService');
const { getDB } = require('../utils/database');

const router = express.Router();

// Get all proposals (for email inbox view)
router.get('/all', async (req, res) => {
  try {
    const db = getDB();
    const proposals = await db.collection('proposals')
      .find({})
      .sort({ receivedAt: -1 })
      .toArray();
    
    // Get vendor information for each proposal
    const proposalsWithVendors = await Promise.all(
      proposals.map(async (proposal) => {
        const vendor = await db.collection('vendors').findOne({ _id: new ObjectId(proposal.vendorId) });
        return {
          ...proposal,
          id: proposal._id.toString(),
          vendor: vendor ? {
            id: vendor._id.toString(),
            name: vendor.name,
            email: vendor.email
          } : { name: 'Unknown Vendor', email: '' }
        };
      })
    );

    res.json(proposalsWithVendors);
  } catch (error) {
    console.error('Error fetching all proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Get proposals for an RFP
router.get('/rfp/:rfpId', async (req, res) => {
  try {
    const { rfpId } = req.params;
    const db = getDB();

    const proposals = await db.collection('proposals').find({ rfpId }).toArray();
    
    // Get vendor information for each proposal
    const proposalsWithVendors = await Promise.all(
      proposals.map(async (proposal) => {
        const vendor = await db.collection('vendors').findOne({ _id: new ObjectId(proposal.vendorId) });
        return {
          ...proposal,
          id: proposal._id.toString(),
          vendor: vendor ? {
            id: vendor._id.toString(),
            name: vendor.name,
            email: vendor.email
          } : { name: 'Unknown Vendor', email: '' }
        };
      })
    );

    res.json(proposalsWithVendors);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Create proposal (simulate receiving email)
router.post('/',
  [
    body('rfpId').notEmpty().withMessage('RFP ID is required'),
    body('vendorId').notEmpty().withMessage('Vendor ID is required'),
    body('rawContent').notEmpty().withMessage('Raw content is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { rfpId, vendorId, rawContent, attachments } = req.body;
      const db = getDB();

      // Check for duplicate proposal from same vendor
      const existingProposal = await db.collection('proposals').findOne({ 
        rfpId, 
        vendorId 
      });

      if (existingProposal) {
        return res.status(400).json({ 
          error: 'A proposal from this vendor already exists for this RFP',
          existingProposalId: existingProposal._id.toString(),
          suggestion: 'Update the existing proposal or delete it first'
        });
      }

      // Get RFP context for AI parsing
      const rfp = await db.collection('rfps').findOne({ _id: new ObjectId(rfpId) });

      if (!rfp) {
        return res.status(404).json({ error: 'RFP not found' });
      }

      // Create initial proposal
      const proposal = {
        rfpId,
        vendorId,
        rawContent,
        attachments,
        status: 'PARSING',
        receivedAt: new Date()
      };

      const result = await db.collection('proposals').insertOne(proposal);
      proposal._id = result.insertedId;

      // Parse with AI
      try {
        const parsedData = await AIService.parseProposalEmail(rawContent, rfp);
        
        // Determine status based on completeness and errors
        let status = 'PARSED';
        if (parsedData.parseError === 'NO_CONTENT') {
          status = 'ERROR';
        } else if (parsedData.parseError === 'INSUFFICIENT_DATA' || !parsedData.isComplete) {
          status = 'INCOMPLETE';
        }
        
        // Update proposal with parsed data
        await db.collection('proposals').updateOne(
          { _id: proposal._id },
          {
            $set: {
              totalPrice: parsedData.totalPrice,
              itemPrices: parsedData.itemPrices,
              deliveryDate: parsedData.deliveryDate ? new Date(parsedData.deliveryDate) : null,
              warranty: parsedData.warranty,
              terms: parsedData.terms,
              aiSummary: parsedData.summary,
              isComplete: parsedData.isComplete,
              parseError: parsedData.parseError,
              status: status,
              parsedAt: new Date()
            }
          }
        );

        const updatedProposal = await db.collection('proposals').findOne({ _id: proposal._id });
        updatedProposal.id = updatedProposal._id.toString();

        res.status(201).json(updatedProposal);
      } catch (parseError) {
        await db.collection('proposals').updateOne(
          { _id: proposal._id },
          { 
            $set: { 
              status: 'ERROR',
              parseError: parseError.message,
              parsedAt: new Date()
            } 
          }
        );

        console.error('Error parsing proposal:', parseError);
        const updatedProposal = await db.collection('proposals').findOne({ _id: proposal._id });
        updatedProposal.id = updatedProposal._id.toString();
        res.status(201).json({ 
          ...updatedProposal, 
          warning: 'Proposal saved but parsing failed. Please review manually.' 
        });
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      res.status(500).json({ error: 'Failed to create proposal' });
    }
  }
);

// Compare proposals for an RFP
router.post('/compare/:rfpId', async (req, res) => {
  try {
    const { rfpId } = req.params;
    const db = getDB();

    // Get RFP and all its proposals
    const rfp = await db.collection('rfps').findOne({ _id: new ObjectId(rfpId) });
    const proposals = await db.collection('proposals').find({ 
      rfpId, 
      status: { $in: ['PARSED', 'INCOMPLETE'] }
    }).toArray();

    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    if (proposals.length < 2) {
      return res.status(400).json({ 
        error: 'Need at least 2 proposals to compare',
        currentCount: proposals.length
      });
    }

    // Use AI to compare proposals
    try {
      const comparison = await AIService.compareProposals(proposals, rfp);
      res.json(comparison);
    } catch (aiError) {
      if (aiError.message.includes('AI_CONFIG_ERROR') || aiError.message.includes('AI_AUTH_ERROR')) {
        return res.status(503).json({ 
          error: 'AI comparison service unavailable. Please check API configuration.',
          details: process.env.NODE_ENV === 'development' ? aiError.message : undefined
        });
      }
      throw aiError;
    }
  } catch (error) {
    console.error('Error comparing proposals:', error);
    res.status(500).json({ error: 'Failed to compare proposals' });
  }
});

module.exports = router;