const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const House = require('../models/House');
const Payment = require('../models/Payment');
const Budget = require('../models/Budget');
const RentPayment = require('../models/RentPayment');

// GET /api/houses/:houseId/book — full financial ledger
router.get('/:houseId/book', auth, async (req, res) => {
  try {
    const { houseId } = req.params;

    const house = await House.findById(houseId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    const isMember = house.members.some(m => m.userId.toString() === req.userId);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this house' });

    const [payments, rents, budgets] = await Promise.all([
      Payment.find({ houseId })
        .populate('createdBy', 'username')
        .populate('contributions.userId', 'username')
        .sort({ paymentDate: -1 }),
      RentPayment.find({ houseId })
        .populate('createdBy', 'username')
        .populate('contributions.userId', 'username')
        .sort({ year: -1, month: -1 }),
      Budget.find({ houseId })
        .populate('createdBy', 'username')
        .sort({ year: -1, month: -1 }),
    ]);

    // Merge payments and rents into a unified ledger
    const entries = [
      ...payments.map(p => ({
        _id: p._id,
        type: 'payment',
        category: p.category,
        amount: p.amount,
        description: p.description,
        receiptUrl: p.receiptUrl,
        contributions: p.contributions,
        createdBy: p.createdBy,
        date: p.paymentDate,
        month: new Date(p.paymentDate).getMonth() + 1,
        year: new Date(p.paymentDate).getFullYear(),
      })),
      ...rents.map(r => ({
        _id: r._id,
        type: 'rent',
        category: 'rent',
        amount: r.totalAmount,
        description: `Rent — ${r.month}/${r.year}`,
        receiptUrl: r.receiptUrl,
        contributions: r.contributions,
        createdBy: r.createdBy,
        date: r.paymentDate,
        month: r.month,
        year: r.year,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Summary stats
    const totalExpenses = entries.reduce((s, e) => s + e.amount, 0);
    const totalBudgeted = budgets.reduce(
      (s, b) => s + b.categories.reduce((cs, c) => cs + c.amount, 0),
      0
    );

    // Category breakdown
    const categoryTotals = {};
    payments.forEach(p => {
      categoryTotals[p.category] = (categoryTotals[p.category] || 0) + p.amount;
    });
    categoryTotals['rent'] = rents.reduce((s, r) => s + r.totalAmount, 0);

    res.json({ entries, totalExpenses, totalBudgeted, categoryTotals, budgets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
