const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record', required: true },
  action: { type: String, required: true },
  oldValue: { type: Object },
  newValue: { type: Object },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  source: { type: String, enum: ['System', 'User'], required: true }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);