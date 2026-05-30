const express = require('express');
const House = require('../models/House');
const Payment = require('../models/Payment');
const RentPayment = require('../models/RentPayment');
const Settlement = require('../models/Settlement');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper: simplify debts into minimal transactions
function simplifyDebts(netBalance, members) {
  const creditors = [];
  const debtors = [];

  members.forEach(m => {
    const bal = netBalance[m.id] || 0;
    if (bal > 0.005) creditors.push({ ...m, amount: bal });
    else if (bal < -0.005) debtors.push({ ...m, amount: -bal });
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const debts = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.005) {
      debts.push({
        from: { id: debtor.id, username: debtor.username },
        to: { id: creditor.id, username: creditor.username },
        amount: Math.round(amount * 100) / 100
      });
    }

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount < 0.005) i++;
    if (creditors[j].amount < 0.005) j++;
  }

  return debts;
}

// GET /api/houses/:houseId/balances — compute balances for the house
router.get('/:houseId/balances', auth, async (req, res) => {
  try {
    const house = await House.findById(req.params.houseId)
      .populate('members.userId', 'username email');

    if (!house) return res.status(404).json({ message: 'House not found' });

    const isMember = house.members.some(m => m.userId._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a member of this house' });

    const members = house.members.map(m => ({
      id: m.userId._id.toString(),
      username: m.userId.username,
      email: m.userId.email,
      role: m.role
    }));

    const numMembers = members.length;
    const netBalance = {};
    members.forEach(m => { netBalance[m.id] = 0; });

    const processEntry = (entry, total) => {
      if (!total || numMembers === 0) return;
      const fairShare = total / numMembers;

      const paid = {};
      members.forEach(m => { paid[m.id] = 0; });

      if (entry.contributions && entry.contributions.length > 0) {
        entry.contributions.forEach(c => {
          const uid = c.userId.toString();
          if (paid[uid] !== undefined) paid[uid] += c.amount;
        });
      } else {
        // No contributions recorded — assume creator paid full amount
        const creator = entry.createdBy?.toString();
        if (creator && paid[creator] !== undefined) paid[creator] = total;
      }

      members.forEach(m => {
        netBalance[m.id] += paid[m.id] - fairShare;
      });
    };

    const [payments, rents, settlements] = await Promise.all([
      Payment.find({ houseId: house._id }),
      RentPayment.find({ houseId: house._id }),
      Settlement.find({ houseId: house._id })
        .populate('paidBy', 'username')
        .populate('paidTo', 'username')
    ]);

    payments.forEach(p => processEntry(p, p.amount));
    rents.forEach(r => processEntry(r, r.totalAmount));

    // Settlements adjust balances
    settlements.forEach(s => {
      const paidById = s.paidBy._id.toString();
      const paidToId = s.paidTo._id.toString();
      if (netBalance[paidById] !== undefined) netBalance[paidById] += s.amount;
      if (netBalance[paidToId] !== undefined) netBalance[paidToId] -= s.amount;
    });

    // Round to 2 decimal places
    members.forEach(m => {
      netBalance[m.id] = Math.round(netBalance[m.id] * 100) / 100;
    });

    const debts = simplifyDebts(netBalance, members);

    res.json({
      members,
      netBalance,
      debts,
      settlements: settlements.map(s => ({
        id: s._id,
        paidBy: { id: s.paidBy._id, username: s.paidBy.username },
        paidTo: { id: s.paidTo._id, username: s.paidTo.username },
        amount: s.amount,
        note: s.note,
        settledAt: s.settledAt
      }))
    });
  } catch (err) {
    console.error('Balance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/houses/:houseId/settle — record a settlement
router.post('/:houseId/settle', auth, async (req, res) => {
  try {
    const { paidTo, amount, note } = req.body;

    const house = await House.findById(req.params.houseId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    const isMember = house.members.some(m => m.userId.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a member' });

    if (!paidTo || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid settlement data' });
    }

    if (paidTo === req.userId.toString()) {
      return res.status(400).json({ message: 'Cannot settle with yourself' });
    }

    const settlement = new Settlement({
      houseId: house._id,
      paidBy: req.userId,
      paidTo,
      amount: parseFloat(amount),
      note: note || '',
      createdBy: req.userId
    });

    await settlement.save();
    res.status(201).json({ message: 'Settlement recorded', settlement });
  } catch (err) {
    console.error('Settle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/houses/:houseId/activity — recent activity feed
router.get('/:houseId/activity', auth, async (req, res) => {
  try {
    const house = await House.findById(req.params.houseId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    const isMember = house.members.some(m => m.userId.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a member' });

    const limit = parseInt(req.query.limit) || 30;

    const [payments, rents, settlements] = await Promise.all([
      Payment.find({ houseId: house._id })
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 })
        .limit(limit),
      RentPayment.find({ houseId: house._id })
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 })
        .limit(limit),
      Settlement.find({ houseId: house._id })
        .populate('paidBy', 'username')
        .populate('paidTo', 'username')
        .sort({ createdAt: -1 })
        .limit(limit)
    ]);

    const activities = [
      ...payments.map(p => ({
        id: p._id,
        type: 'payment',
        actor: p.createdBy?.username || 'Unknown',
        description: p.description || p.category,
        category: p.category,
        amount: p.amount,
        date: p.createdAt
      })),
      ...rents.map(r => ({
        id: r._id,
        type: 'rent',
        actor: r.createdBy?.username || 'Unknown',
        description: `Rent for ${new Date(r.year, r.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        category: 'rent',
        amount: r.totalAmount,
        date: r.createdAt
      })),
      ...settlements.map(s => ({
        id: s._id,
        type: 'settlement',
        actor: s.paidBy?.username || 'Unknown',
        description: `${s.paidBy?.username} paid ${s.paidTo?.username}`,
        paidTo: s.paidTo?.username,
        amount: s.amount,
        note: s.note,
        date: s.createdAt
      }))
    ];

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ activities: activities.slice(0, limit) });
  } catch (err) {
    console.error('Activity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
