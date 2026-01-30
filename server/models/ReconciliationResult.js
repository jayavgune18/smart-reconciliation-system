const mongoose = require('mongoose');

const reconciliationResultSchema = new mongoose.Schema({
  recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record', required: true },
  systemRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record' },
  matchStatus: { type: String, enum: ['Matched', 'Partially Matched', 'Not Matched', 'Duplicate'], required: true },
  mismatches: [{ field: String, uploadedValue: mongoose.Schema.Types.Mixed, systemValue: mongoose.Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReconciliationResult', reconciliationResultSchema);