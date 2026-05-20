const express = require('express');
const router = express.Router();
const { getStats, getFraudAlerts, getAuditLogs } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/stats', protect, getStats);
router.get('/fraud-alerts', protect, authorize('admin'), getFraudAlerts);
router.get('/audit-logs', protect, authorize('admin'), getAuditLogs);

module.exports = router;
