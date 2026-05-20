const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  action: { 
    type: String, 
    required: true 
  },
  details: { 
    type: mongoose.Schema.Types.Mixed 
  },
  ipAddress: { 
    type: String 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
