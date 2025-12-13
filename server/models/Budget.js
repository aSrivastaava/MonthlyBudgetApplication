const mongoose = require('mongoose');

const budgetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['groceries', 'wifi', 'gas', 'electricity', 'other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const budgetSchema = new mongoose.Schema({
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
  categories: [budgetCategorySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure unique budget per house per month/year
budgetSchema.index({ houseId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
