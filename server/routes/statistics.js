const express = require('express');
const Budget = require('../models/Budget');
const Payment = require('../models/Payment');
const House = require('../models/House');
const auth = require('../middleware/auth');

const router = express.Router();

// Get budget statistics for a house by month/year
router.get('/:houseId/statistics/:year/:month', auth, async (req, res) => {
  try {
    const { houseId, year, month } = req.params;
    
    // Check if user is a member
    const house = await House.findById(houseId).populate('members.userId', 'username email');
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    const userMembership = house.members.find(member => member.userId._id.toString() === req.userId.toString());
    if (!userMembership) {
      return res.status(403).json({ message: 'You are not a member of this house' });
    }
    
    // Get budget for this month
    const budget = await Budget.findOne({ 
      houseId, 
      month: parseInt(month), 
      year: parseInt(year) 
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found for this month' });
    }
    
    // Get all payments for this budget
    const payments = await Payment.find({ budgetId: budget._id })
      .populate('contributions.userId', 'username email');
    
    // Calculate statistics by category
    const categoryStats = {};
    budget.categories.forEach(cat => {
      categoryStats[cat.name] = {
        budgeted: cat.amount,
        spent: 0,
        remaining: cat.amount,
        payments: []
      };
    });
    
    // Calculate spent amounts
    payments.forEach(payment => {
      if (categoryStats[payment.category]) {
        categoryStats[payment.category].spent += payment.amount;
        categoryStats[payment.category].remaining = 
          categoryStats[payment.category].budgeted - categoryStats[payment.category].spent;
        categoryStats[payment.category].payments.push({
          amount: payment.amount,
          description: payment.description,
          date: payment.paymentDate
        });
      }
    });
    
    // Calculate member contributions
    const memberContributions = {};
    house.members.forEach(member => {
      memberContributions[member.userId._id.toString()] = {
        userId: member.userId._id,
        username: member.userId.username,
        totalContributed: 0,
        totalSpent: 0,
        balance: 0
      };
    });
    
    payments.forEach(payment => {
      payment.contributions.forEach(contrib => {
        const userId = contrib.userId._id ? contrib.userId._id.toString() : contrib.userId.toString();
        if (memberContributions[userId]) {
          memberContributions[userId].totalContributed += contrib.amount;
        }
      });
    });
    
    // Calculate total budgeted and spent
    const totalBudgeted = budget.categories.reduce((sum, cat) => sum + cat.amount, 0);
    const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate how much each member should have contributed
    const memberCount = house.members.length;
    const expectedContributionPerMember = totalSpent / memberCount;
    
    Object.keys(memberContributions).forEach(userId => {
      memberContributions[userId].totalSpent = expectedContributionPerMember;
      memberContributions[userId].balance = 
        memberContributions[userId].totalContributed - memberContributions[userId].totalSpent;
    });
    
    res.json({
      statistics: {
        totalBudgeted,
        totalSpent,
        totalRemaining: totalBudgeted - totalSpent,
        categoryStats,
        memberContributions: Object.values(memberContributions)
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error calculating statistics' });
  }
});

module.exports = router;
