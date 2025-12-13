const express = require('express');
const Budget = require('../models/Budget');
const House = require('../models/House');
const auth = require('../middleware/auth');

const router = express.Router();

// Create or update monthly budget (Financier only)
router.post('/:houseId/budget', auth, async (req, res) => {
  try {
    const { month, year, categories } = req.body;
    const { houseId } = req.params;
    
    if (!month || !year || !categories || !Array.isArray(categories)) {
      return res.status(400).json({ message: 'Please provide month, year, and categories' });
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
      return res.status(403).json({ message: 'Only financiers, admins, and owners can manage budgets' });
    }
    
    // Check if budget already exists for this month/year
    let budget = await Budget.findOne({ houseId, month, year });
    
    if (budget) {
      // Update existing budget
      budget.categories = categories;
      await budget.save();
      res.json({ message: 'Budget updated successfully', budget });
    } else {
      // Create new budget
      budget = new Budget({
        houseId,
        month,
        year,
        categories,
        createdBy: req.userId
      });
      await budget.save();
      res.status(201).json({ message: 'Budget created successfully', budget });
    }
  } catch (error) {
    console.error('Create/Update budget error:', error);
    res.status(500).json({ message: 'Server error managing budget' });
  }
});

// Get budget for a house by month/year
router.get('/:houseId/budget/:year/:month', auth, async (req, res) => {
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
    
    const budget = await Budget.findOne({ 
      houseId, 
      month: parseInt(month), 
      year: parseInt(year) 
    }).populate('createdBy', 'username email');
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found for this month' });
    }
    
    res.json({ budget });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ message: 'Server error fetching budget' });
  }
});

// Get all budgets for a house
router.get('/:houseId/budgets', auth, async (req, res) => {
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
    
    const budgets = await Budget.find({ houseId })
      .populate('createdBy', 'username email')
      .sort({ year: -1, month: -1 });
    
    res.json({ budgets });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error fetching budgets' });
  }
});

module.exports = router;
