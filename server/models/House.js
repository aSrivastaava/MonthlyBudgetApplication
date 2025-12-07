const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  houseKey: {
    type: String,
    required: true,
    unique: true,
    length: 6
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'financier', 'rent payer', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate unique 6-digit alphanumeric house key
houseSchema.statics.generateHouseKey = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let houseKey = '';
  
  // Keep generating until we find a unique key
  let isUnique = false;
  while (!isUnique) {
    houseKey = '';
    for (let i = 0; i < 6; i++) {
      houseKey += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if key already exists
    const existingHouse = await this.findOne({ houseKey });
    if (!existingHouse) {
      isUnique = true;
    }
  }
  
  return houseKey;
};

module.exports = mongoose.model('House', houseSchema);
