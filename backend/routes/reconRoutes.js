const express = require('express');
const router = express.Router();
const { uploadAndIngest, getJobs, getMatchesByJob, resolveMatch, processInvoiceOCR } = require('../controllers/reconController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadLimiter } = require('../middlewares/rateLimiter');
const upload = require('../middlewares/uploadMiddleware');

// Config double file uploads for Reconciliation (Multer)
const uploadFields = upload.fields([
  { name: 'bankFile', maxCount: 1 },
  { name: 'internalFile', maxCount: 1 }
]);

router.post('/upload', protect, uploadLimiter, uploadFields, uploadAndIngest);
router.post('/ocr', protect, uploadLimiter, upload.single('invoiceFile'), processInvoiceOCR);
router.get('/jobs', protect, getJobs);
router.get('/matches/:jobId', protect, getMatchesByJob);
router.put('/matches/:matchId/resolve', protect, resolveMatch);

module.exports = router;
