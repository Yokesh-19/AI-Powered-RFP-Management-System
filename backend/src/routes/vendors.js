const express = require('express');
const { ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../utils/database');

const router = express.Router();

// Create vendor
router.post('/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone, address, contactPerson } = req.body;
      const db = getDB();

      // Check if email already exists
      const existingVendor = await db.collection('vendors').findOne({ email });
      if (existingVendor) {
        return res.status(400).json({ 
          error: 'A vendor with this email already exists',
          field: 'email'
        });
      }

      const vendor = {
        name,
        email,
        phone,
        address,
        contactPerson,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('vendors').insertOne(vendor);
      vendor._id = result.insertedId;
      vendor.id = vendor._id.toString();

      res.status(201).json(vendor);
    } catch (error) {
      console.error('Error creating vendor:', error);
      res.status(500).json({ error: 'Failed to create vendor' });
    }
  }
);

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    // Only get active vendors
    const vendors = await db.collection('vendors').find({ isActive: { $ne: false } }).sort({ name: 1 }).toArray();

    const vendorsWithId = vendors.map(vendor => ({
      ...vendor,
      id: vendor._id.toString()
    }));

    res.json(vendorsWithId);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get specific vendor
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const vendor = await db.collection('vendors').findOne({ _id: new ObjectId(id) });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    vendor.id = vendor._id.toString();
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// Update vendor
router.put('/:id',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, email, phone, address, contactPerson } = req.body;
      const db = getDB();

      // Check if email already exists for a different vendor
      const existingVendor = await db.collection('vendors').findOne({ 
        email,
        _id: { $ne: new ObjectId(id) }
      });
      if (existingVendor) {
        return res.status(400).json({ 
          error: 'A different vendor with this email already exists',
          field: 'email'
        });
      }

      const result = await db.collection('vendors').updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            name, 
            email, 
            phone, 
            address, 
            contactPerson, 
            updatedAt: new Date() 
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      const vendor = await db.collection('vendors').findOne({ _id: new ObjectId(id) });
      vendor.id = vendor._id.toString();

      res.json(vendor);
    } catch (error) {
      console.error('Error updating vendor:', error);
      res.status(500).json({ error: 'Failed to update vendor' });
    }
  }
);

// Delete vendor (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid vendor ID' });
    }

    // Soft delete - mark as inactive
    const result = await db.collection('vendors').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

module.exports = router;