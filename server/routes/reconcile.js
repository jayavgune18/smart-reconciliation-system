const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../middleware/auth');
const Record = require('../models/Record');
const ReconciliationResult = require('../models/ReconciliationResult');
const AuditLog = require('../models/AuditLog');
const UploadJob = require('../models/UploadJob');
const MatchingRules = require('../models/MatchingRules');

const router = express.Router();

async function reconcileSingleRecord(record, jobId, rules) {
  let matchStatus = 'Not Matched';
  let systemRecord = null;
  let mismatches = [];

  // Fetch all active rules
  const exactRule = rules.find(r => r.ruleType === 'Exact');
  const partialRule = rules.find(r => r.ruleType === 'Partial');
  const duplicateRule = rules.find(r => r.ruleType === 'Duplicate');

  // 1. Exact Match Check
  if (exactRule) {
    const query = { isSystem: true };
    exactRule.criteria.fields.forEach(field => {
      query[field] = record[field];
    });
    systemRecord = await Record.findOne(query);
    if (systemRecord) matchStatus = 'Matched';
  }

  // 2. Partial Match Check (if not exact match)
  if (matchStatus === 'Not Matched' && partialRule) {
    const query = { isSystem: true };
    partialRule.criteria.fields.forEach(field => {
      query[field] = record[field];
    });

    // We try to find a system record with matching non-amount fields
    const candidates = await Record.find(query);
    for (const candidate of candidates) {
      const variance = Math.abs((candidate.amount - record.amount) / candidate.amount);
      if (variance <= partialRule.criteria.variance) {
        matchStatus = 'Partially Matched';
        systemRecord = candidate;
        mismatches.push({
          field: 'amount',
          uploadedValue: record.amount,
          systemValue: candidate.amount,
          variance: `${(variance * 100).toFixed(2)}%`
        });
        break;
      }
    }
  }

  // 3. Duplicate Check
  if (duplicateRule) {
    const query = { uploadJobId: jobId };
    duplicateRule.criteria.fields.forEach(field => {
      query[field] = record[field];
    });
    const duplicateCount = await Record.countDocuments(query);
    if (duplicateCount > 1) {
      matchStatus = 'Duplicate';
    }
  }

  return { matchStatus, systemRecordId: systemRecord?._id, mismatches };
}

async function reconcileJob(jobId) {
  try {
    console.log(`Starting reconciliation for job: ${jobId}`);
    const uploadedRecords = await Record.find({ uploadJobId: jobId });
    console.log(`Found ${uploadedRecords.length} uploaded records to reconcile.`);

    // Fetch all active rules ONCE
    const rules = await MatchingRules.find();

    // Clear previous results for this job
    const recordIds = uploadedRecords.map(r => r._id);
    await ReconciliationResult.deleteMany({ recordId: { $in: recordIds } });

    for (const record of uploadedRecords) {
      console.log(`Checking record: ${record.transactionId}, Amount: ${record.amount}`);
      const { matchStatus, systemRecordId, mismatches } = await reconcileSingleRecord(record, jobId, rules);
      console.log(`Result for ${record.transactionId}: ${matchStatus}`);

      // Create Result
      await ReconciliationResult.create({
        recordId: record._id,
        systemRecordId,
        matchStatus,
        mismatches
      });

      // Create Audit Log
      await AuditLog.create({
        recordId: record._id,
        action: 'Reconcile',
        oldValue: null,
        newValue: matchStatus,
        userId: null,
        source: 'System',
        timestamp: new Date()
      });
    }
    console.log(`Reconciliation completed for job: ${jobId}`);
  } catch (error) {
    console.error(`Error in reconcileJob for ${jobId}:`, error);
    throw error;
  }
}
/*  ROUTES */
router.get('/summary', authenticate, authorize(['Admin', 'Analyst', 'Viewer']), async (req, res) => {
  try {
    const summary = await ReconciliationResult.aggregate([
      {
        $group: {
          _id: '$matchStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const data = {
      total: 0,
      matched: 0,
      partiallyMatched: 0,
      notMatched: 0,
      duplicate: 0
    };

    summary.forEach(s => {
      data.total += s.count;
      if (s._id === 'Matched') data.matched = s.count;
      if (s._id === 'Partially Matched') data.partiallyMatched = s.count;
      if (s._id === 'Not Matched') data.notMatched = s.count;
      if (s._id === 'Duplicate') data.duplicate = s.count;
    });

    data.accuracyPercentage = data.total > 0 ? ((data.matched / data.total) * 100).toFixed(2) : '0.00';

    data.chartData = [
      { name: 'Matched', count: data.matched },
      { name: 'Partially Matched', count: data.partiallyMatched },
      { name: 'Not Matched', count: data.notMatched },
      { name: 'Duplicate', count: data.duplicate }
    ];

    // Find latest job details
    const latestJob = await UploadJob.findOne().sort({ createdAt: -1 });
    if (latestJob) {
      const jobRecords = await Record.find({ uploadJobId: latestJob._id }).select('_id');
      const jobRecordIds = jobRecords.map(r => r._id);
      const jobResults = await ReconciliationResult.aggregate([
        { $match: { recordId: { $in: jobRecordIds } } },
        { $group: { _id: '$matchStatus', count: { $sum: 1 } } }
      ]);

      data.latestJob = {
        id: latestJob._id,
        filename: latestJob.filename,
        status: latestJob.status,
        results: jobResults
      };
    }

    // Get Recent Activity (Audit Logs)
    const recentLogs = await AuditLog.find()
      .populate('userId', 'username')
      .sort({ timestamp: -1 })
      .limit(5);

    data.recentActivity = recentLogs.map(log => ({
      id: log._id,
      action: log.action,
      user: log.userId?.username || log.source || 'System',
      timestamp: log.timestamp,
      recordId: log.recordId
    }));

    res.json(data);
  } catch (error) {
    console.error('Summary Error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});


// Parameterized routes LAST
router.get('/:jobId', authenticate, authorize(['Admin', 'Analyst']), async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: 'Invalid Job ID format' });
    }
    // Find all records for this job
    const records = await Record.find({ uploadJobId: jobId }).select('_id');
    const recordIds = records.map(r => r._id);

    // Find results for these records
    const results = await ReconciliationResult.find({ recordId: { $in: recordIds } })
      .populate('recordId')
      .populate('systemRecordId');

    res.json(results);
  } catch (error) {
    console.error('Error fetching job results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

router.post('/:jobId', authenticate, authorize(['Admin', 'Analyst']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await UploadJob.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Trigger reconciliation (this is async)
    reconcileJob(jobId);

    res.json({ message: 'Reconciliation triggered successfully' });
  } catch (error) {
    console.error('Error triggering reconciliation:', error);
    res.status(500).json({ error: 'Failed to trigger reconciliation' });
  }
});

// Manual Correction Route
router.put('/correct/:resultId', authenticate, authorize(['Admin', 'Analyst']), async (req, res) => {
  try {
    const { resultId } = req.params;
    const { correctionData } = req.body; // e.g., { amount: 2500 }

    const result = await ReconciliationResult.findById(resultId).populate('recordId');
    if (!result) return res.status(404).json({ error: 'Reconciliation result not found' });

    const record = result.recordId;
    const oldValues = {
      amount: record.amount,
      referenceNumber: record.referenceNumber,
      transactionId: record.transactionId
    };

    // Update the record with correction data
    if (correctionData.amount !== undefined) record.amount = correctionData.amount;
    if (correctionData.referenceNumber !== undefined) record.referenceNumber = correctionData.referenceNumber;
    if (correctionData.transactionId !== undefined) record.transactionId = correctionData.transactionId;

    await record.save();

    const previousStatus = result.matchStatus;

    // Re-run reconciliation for this record
    const rules = await MatchingRules.find();
    const { matchStatus, systemRecordId, mismatches } = await reconcileSingleRecord(record, record.uploadJobId, rules);

    // Update Result
    result.matchStatus = matchStatus;
    result.systemRecordId = systemRecordId;
    result.mismatches = mismatches;
    await result.save();

    // Create Audit Log for Correction
    await AuditLog.create({
      recordId: record._id,
      action: 'Correction',
      oldValue: oldValues,
      newValue: {
        amount: record.amount,
        referenceNumber: record.referenceNumber,
        transactionId: record.transactionId,
        matchStatus: matchStatus
      },
      userId: req.user.id,
      source: 'User',
      timestamp: new Date()
    });

    res.json({ message: 'Record corrected and re-reconciled', result });
  } catch (error) {
    console.error('Error correcting record:', error);
    res.status(500).json({ error: 'Failed to correct record' });
  }
});

module.exports = { router, reconcileJob };


