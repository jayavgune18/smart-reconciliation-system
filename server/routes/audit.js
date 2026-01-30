const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Global Audit List (Admin Only)
router.get('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('recordId')
      .populate('userId', 'username')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/:recordId', authenticate, authorize(['Admin']), async (req, res) => {
  const { recordId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(recordId)) {
    return res.status(400).json({ error: 'Invalid Record ID format' });
  }
  const logs = await AuditLog.find({ recordId }).populate('userId').sort({ timestamp: -1 });
  res.json(logs);
});



module.exports = router;