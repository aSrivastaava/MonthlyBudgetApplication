const express = require('express');
const multer = require('multer');
const path = require('path');
const RentPayment = require('../models/RentPayment');
const House = require('../models/House');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/rent-receipts/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'rent-receipt-' + uniqueSuffix + path.extname(file.originalname));
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

// Create or update rent payment (Rent Payer only)
router.post('/:houseId/rent', auth, upload.single('receipt'), async (req, res) => {
  try {
    const { month, year, totalAmount, contributions } = req.body;
    const { houseId } = req.params;
    
    if (!month || !year || !totalAmount) {
      return res.status(400).json({ message: 'Please provide month, year, and totalAmount' });
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
    
    // Check if user is rent payer, admin, or owner
    if (!['owner', 'admin', 'rent payer'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Only rent payers, admins, and owners can manage rent payments' });
    }
    
    // Parse contributions if provided
    let parsedContributions = [];
    if (contributions) {
      try {
        parsedContributions = JSON.parse(contributions);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid contributions format' });
      }
    }
    
    // Check if rent payment already exists for this month/year
    let rentPayment = await RentPayment.findOne({ 
      houseId, 
      month: parseInt(month), 
      year: parseInt(year) 
    });
    
    if (rentPayment) {
      // Update existing rent payment
      rentPayment.totalAmount = parseFloat(totalAmount);
      rentPayment.contributions = parsedContributions;
      if (req.file) {
        rentPayment.receiptUrl = `/uploads/rent-receipts/${req.file.filename}`;
      }
      await rentPayment.save();
      res.json({ message: 'Rent payment updated successfully', rentPayment });
    } else {
      // Create new rent payment
      rentPayment = new RentPayment({
        houseId,
        month: parseInt(month),
        year: parseInt(year),
        totalAmount: parseFloat(totalAmount),
        receiptUrl: req.file ? `/uploads/rent-receipts/${req.file.filename}` : null,
        contributions: parsedContributions,
        createdBy: req.userId
      });
      await rentPayment.save();
      res.status(201).json({ message: 'Rent payment recorded successfully', rentPayment });
    }
  } catch (error) {
    console.error('Create/Update rent payment error:', error);
    res.status(500).json({ message: 'Server error managing rent payment' });
  }
});

// Get rent payment for a house by month/year
router.get('/:houseId/rent/:year/:month', auth, async (req, res) => {
  try {
    const { houseId, year, month } = req.params;
    
    // Check if user is a member
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    const userMembership = house.members.find(member => member.userId.toString() === req.userId.toString());
    if (!userMembership) {
      return res.status(403).json({ message: 'You are not a member of this house' });
    }
    
    const rentPayment = await RentPayment.findOne({ 
      houseId, 
      month: parseInt(month), 
      year: parseInt(year) 
    }).populate('createdBy', 'username email')
      .populate('contributions.userId', 'username email');
    
    if (!rentPayment) {
      return res.status(404).json({ message: 'Rent payment not found for this month' });
    }
    
    res.json({ rentPayment });
  } catch (error) {
    console.error('Get rent payment error:', error);
    res.status(500).json({ message: 'Server error fetching rent payment' });
  }
});

// Get all rent payments for a house
router.get('/:houseId/rent', auth, async (req, res) => {
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
    
    const rentPayments = await RentPayment.find({ houseId })
      .populate('createdBy', 'username email')
      .populate('contributions.userId', 'username email')
      .sort({ year: -1, month: -1 });
    
    res.json({ rentPayments });
  } catch (error) {
    console.error('Get rent payments error:', error);
    res.status(500).json({ message: 'Server error fetching rent payments' });
  }
});

module.exports = router;
