const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const Payment = require('../models/Payment');
const Budget = require('../models/Budget');
const House = require('../models/House');
const auth = require('../middleware/auth');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/receipts');
fs.ensureDirSync(uploadDir);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// Create payment record (Financier only)
router.post('/:houseId/payment', auth, upload.single('receipt'), async (req, res) => {
  try {
    const { budgetId, category, amount, description, contributions } = req.body;
    const { houseId } = req.params;
    
    if (!budgetId || !category || !amount) {
      return res.status(400).json({ message: 'Please provide budgetId, category, and amount' });
    }
    
    // Check if house exists and user is a member
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    const userMembership = house.members.find(member => member.userId.toString() === req.userId.toString());
    if (!userMembership) {
      return res.status(403).json({ message: 'You are not a member of this house' });
    }
    
    // Check if user is financier, admin, or owner
    if (!['owner', 'admin', 'financier'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Only financiers, admins, and owners can add payments' });
    }
    
    // Verify budget exists
    const budget = await Budget.findById(budgetId);
    if (!budget || budget.houseId.toString() !== houseId) {
      return res.status(404).json({ message: 'Budget not found for this house' });
    }
    
    // Parse contributions if provided
    let parsedContributions = [];
    if (contributions) {
      if (typeof contributions !== 'string') {
        return res.status(400).json({ message: 'Contributions must be a JSON string' });
      }
      try {
        parsedContributions = JSON.parse(contributions);
        if (!Array.isArray(parsedContributions)) {
          return res.status(400).json({ message: 'Contributions must be an array' });
        }
      } catch (e) {
        return res.status(400).json({ message: 'Invalid contributions format' });
      }
    }
    
    // Create payment
    const payment = new Payment({
      houseId,
      budgetId,
      category,
      amount: parseFloat(amount),
      description,
      receiptUrl: req.file ? `/uploads/receipts/${req.file.filename}` : null,
      contributions: parsedContributions,
      createdBy: req.userId
    });
    
    await payment.save();
    
    res.status(201).json({ message: 'Payment recorded successfully', payment });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error recording payment' });
  }
});

// Get payments for a budget
router.get('/:houseId/payments/:budgetId', auth, async (req, res) => {
  try {
    const { houseId, budgetId } = req.params;
    
    // Check if user is a member
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    const userMembership = house.members.find(member => member.userId.toString() === req.userId.toString());
    if (!userMembership) {
      return res.status(403).json({ message: 'You are not a member of this house' });
    }
    
    const payments = await Payment.find({ houseId, budgetId })
      .populate('createdBy', 'username email')
      .populate('contributions.userId', 'username email')
      .sort({ paymentDate: -1 });
    
    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
});

// Get all payments for a house
router.get('/:houseId/payments', auth, async (req, res) => {
  try {
    const { houseId } = req.params;
    
    // Check if user is a member
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    const userMembership = house.members.find(member => member.userId.toString() === req.userId.toString());
    if (!userMembership) {
      return res.status(403).json({ message: 'You are not a member of this house' });
    }
    
    const payments = await Payment.find({ houseId })
      .populate('createdBy', 'username email')
      .populate('contributions.userId', 'username email')
      .populate('budgetId')
      .sort({ paymentDate: -1 });
    
    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
});

// Delete a payment (financier/admin/owner only)
router.delete('/:houseId/payments/:paymentId', auth, async (req, res) => {
  try {
    const { houseId, paymentId } = req.params;

    const house = await House.findById(houseId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    const userMembership = house.members.find(m => m.userId.toString() === req.userId.toString());
    if (!userMembership) return res.status(403).json({ message: 'Not a member' });

    if (!['owner', 'admin', 'financier'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const payment = await Payment.findOne({ _id: paymentId, houseId });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Delete receipt file if exists
    if (payment.receiptUrl) {
      const filePath = path.join(__dirname, '../../', payment.receiptUrl);
      fs.remove(filePath).catch(() => {});
    }

    await Payment.deleteOne({ _id: paymentId });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
