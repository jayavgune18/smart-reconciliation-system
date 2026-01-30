const mongoose = require('mongoose');

const uploadJobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  status: { type: String, enum: ['Processing', 'Completed', 'Failed'], default: 'Processing' },
  fileHash: { type: String, required: true },
  columnMapping: { type: Object, default: {} },
  filePath: { type: String }, // Store for re-processing
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UploadJob', uploadJobSchema);
