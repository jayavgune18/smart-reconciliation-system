const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  uploadJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadJob' },
  transactionId: { type: String, required: true },
  amount: { type: Number, required: true },
  referenceNumber: { type: String, required: true },
  date: { type: Date, required: true },
  isSystem: { type: Boolean, default: false }
});

recordSchema.index({ transactionId: 1, referenceNumber: 1, uploadJobId: 1 });

module.exports = mongoose.model('Record', recordSchema);