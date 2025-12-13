const mongoose = require('mongoose');

const rentContributionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const rentPaymentSchema = new mongoose.Schema({
  houseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'House',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  receiptUrl: {
    type: String,
    trim: true
  },
  contributions: [rentContributionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique rent payment per house per month/year
rentPaymentSchema.index({ houseId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('RentPayment', rentPaymentSchema);
