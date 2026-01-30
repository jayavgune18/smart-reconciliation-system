const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { authenticate, authorize } = require('../middleware/auth');
const UploadJob = require('../models/UploadJob');
const queue = require('../queue');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Mandatory fields validation helper
const validateMapping = (mapping) => {
  const mandatory = ['transactionId', 'amount', 'referenceNumber', 'date'];
  const missing = mandatory.filter(field => !mapping[field]);
  return missing;
};

router.post(
  '/',
  authenticate,
  authorize(['Admin', 'Analyst']),
  upload.single('file'),
  async (req, res) => {
    try {
      let columnMapping = {};
      if (req.body.columnMapping) {
        columnMapping = JSON.parse(req.body.columnMapping);
      }

      // 1. Mandatory Fields check
      const missing = validateMapping(columnMapping);
      if (missing.length > 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: `Missing mandatory mapping fields: ${missing.join(', ')}` });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileHash = crypto
        .createHash('md5')
        .update(fs.readFileSync(req.file.path))
        .digest('hex');

      const existingJob = await UploadJob.findOne({ fileHash });
      if (existingJob) {
        fs.unlinkSync(req.file.path);
        return res.json({
          jobId: existingJob._id,
          message: 'File already uploaded, using existing job'
        });
      }

      const job = new UploadJob({
        userId: req.user.id,
        fileName: req.file.originalname,
        fileHash,
        status: 'Processing',
        columnMapping,
        filePath: req.file.path
      });

      await job.save();

      queue.add({
        jobId: job._id,
        filePath: req.file.path,
        columnMapping
      });

      res.json({
        jobId: job._id,
        message: 'File uploaded successfully and processing started'
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Upload failed', details: error.message });
    }
  }
);

// 2. Allow correction of mapping without re-uploading
router.patch('/:jobId/mapping', authenticate, authorize(['Admin', 'Analyst']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { columnMapping } = req.body;

    const missing = validateMapping(columnMapping);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing mandatory mapping fields: ${missing.join(', ')}` });
    }

    const job = await UploadJob.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (!job.filePath || !fs.existsSync(job.filePath)) {
      return res.status(400).json({ error: 'Original file no longer exists. Please re-upload.' });
    }

    job.columnMapping = columnMapping;
    job.status = 'Processing';
    await job.save();

    // Re-trigger processing
    queue.add({
      jobId: job._id,
      filePath: job.filePath,
      columnMapping
    });

    res.json({ message: 'Mapping updated and re-processing started', jobId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update mapping' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const jobs = await UploadJob.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'username');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

module.exports = router;
