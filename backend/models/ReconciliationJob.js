const mongoose = require('mongoose');

const ReconciliationJobSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed'], 
    default: 'processing',
    index: true
  },
  stats: {
    totalBank: { type: Number, default: 0 },
    totalInternal: { type: Number, default: 0 },
    matchedCount: { type: Number, default: 0 },
    partialMatchedCount: { type: Number, default: 0 },
    unmatchedCount: { type: Number, default: 0 },
    discrepancyCount: { type: Number, default: 0 }
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('ReconciliationJob', ReconciliationJobSchema);
