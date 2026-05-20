const express = require('express');
const router = express.Router();
const { downloadPdfReport, downloadExcelReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/pdf/:jobId', protect, downloadPdfReport);
router.get('/excel/:jobId', protect, downloadExcelReport);

module.exports = router;
