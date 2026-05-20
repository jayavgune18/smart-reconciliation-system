const mongoose = require('mongoose');

const ReconciliationMatchSchema = new mongoose.Schema({
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ReconciliationJob', 
    required: true, 
    index: true 
  },
  bankTransactionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Transaction',
    index: true
  },
  internalTransactionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Transaction',
    index: true
  },
  matchType: { 
    type: String, 
    enum: ['exact', 'partial', 'ai_predicted', 'unmatched'], 
    required: true,
    index: true
  },
  confidenceScore: { 
    type: Number, 
    min: 0, 
    max: 100, 
    required: true 
  },
  explanation: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['auto_approved', 'pending_review', 'flagged_fraud', 'resolved'], 
    default: 'pending_review',
    index: true
  },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedAt: { 
    type: Date 
  }
}, { timestamps: true });

module.exports = mongoose.model('ReconciliationMatch', ReconciliationMatchSchema);
