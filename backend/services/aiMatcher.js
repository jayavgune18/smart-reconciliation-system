const Transaction = require('../models/Transaction');
const ReconciliationMatch = require('../models/ReconciliationMatch');
const ReconciliationJob = require('../models/ReconciliationJob');
const { calculateIntelligentScore } = require('../utils/similarity');
const { notifyJobUpdate } = require('../config/socket');

/**
 * AI Reconciliation Engine Service
 */
class ReconciliationEngine {
  /**
   * Run matching algorithm on a specific Job
   * @param {string} jobId - Reconciliation Job ID
   */
  static async runMatching(jobId) {
    console.log(`🤖 Starting AI Reconciliation Engine for Job: ${jobId}`);
    const job = await ReconciliationJob.findById(jobId);
    if (!job) {
      throw new Error('Reconciliation Job not found');
    }

    try {
      // 1. Fetch transactions uploaded in this job
      const bankTxns = await Transaction.find({ uploadJobId: jobId, source: 'bank' });
      const internalTxns = await Transaction.find({ uploadJobId: jobId, source: 'internal' });

      job.stats.totalBank = bankTxns.length;
      job.stats.totalInternal = internalTxns.length;
      await job.save();

      notifyJobUpdate(jobId, { status: 'processing', progress: 10, message: 'Ingested records. Initiating Exact Match pass...' });

      const matchedBankIds = new Set();
      const matchedInternalIds = new Set();
      const matchRecords = [];

      // ==========================================
      // PASS 1: DETERMINISTIC EXACT MATCHING
      // ==========================================
      // Criteria: Matching External Transaction ID OR (Exact Amount + Exact Date + High String Similarity)
      for (const bankTxn of bankTxns) {
        if (bankTxn.transactionId) {
          // Check if there is an internal txn with the exact same transaction ID
          const exactIdMatch = internalTxns.find(
            intTxn => !matchedInternalIds.has(intTxn._id.toString()) && 
                      intTxn.transactionId && 
                      intTxn.transactionId.toLowerCase() === bankTxn.transactionId.toLowerCase()
          );

          if (exactIdMatch) {
            matchedBankIds.add(bankTxn._id.toString());
            matchedInternalIds.add(exactIdMatch._id.toString());
            
            matchRecords.push({
              jobId,
              bankTransactionId: bankTxn._id,
              internalTransactionId: exactIdMatch._id,
              matchType: 'exact',
              confidenceScore: 100,
              explanation: `Deterministic match. Exact transaction ID match: "${bankTxn.transactionId}".`,
              status: 'auto_approved'
            });

            bankTxn.status = 'reconciled';
            exactIdMatch.status = 'reconciled';
            await bankTxn.save();
            await exactIdMatch.save();
          }
        }
      }

      notifyJobUpdate(jobId, { status: 'processing', progress: 40, message: 'Completed deterministic matches. Launching Intelligent NLP Matching...' });

      // ==========================================
      // PASS 2: AI-ASSISTED NLP & FUZZY MATCHING
      // ==========================================
      // Criteria: Compare unmatched transactions for close amounts and date proximity + description resemblance
      const unmatchedBankTxns = bankTxns.filter(t => !matchedBankIds.has(t._id.toString()));
      const unmatchedInternalTxns = internalTxns.filter(t => !matchedInternalIds.has(t._id.toString()));

      const DATE_WINDOW_DAYS = 5; // Reconcile within ±5 days window

      for (const bankTxn of unmatchedBankTxns) {
        let bestMatch = null;
        let highestConfidence = 0;
        let matchExplanation = '';
        let matchedCategory = 'partial';

        for (const internalTxn of unmatchedInternalTxns) {
          if (matchedInternalIds.has(internalTxn._id.toString())) continue;

          // 1. Amount match evaluation
          // In standard reconciliation, we support absolute matching or exact matching.
          const amountDiff = Math.abs(bankTxn.amount) - Math.abs(internalTxn.amount);
          const isAmountMatch = Math.abs(amountDiff) < 0.01; // Allow sub-cent float variation

          if (!isAmountMatch) continue; // In this engine, we require amount matching to pair.

          // 2. Date proximity evaluation
          const timeDiff = Math.abs(bankTxn.date.getTime() - internalTxn.date.getTime());
          const diffInDays = timeDiff / (1000 * 60 * 60 * 24);

          if (diffInDays > DATE_WINDOW_DAYS) continue; // Out of allowed transaction window

          // Proximity rating: same day = 100%, each day variance reduces proximity score
          const dateProximityScore = Math.max(0, 100 - (diffInDays * 15));

          // 3. String Description NLP Evaluation
          const nlpStringScore = calculateIntelligentScore(bankTxn.description, internalTxn.description);

          // Combined Confidence scoring: 70% string similarity + 30% date proximity
          const confidence = Math.round((nlpStringScore * 0.7) + (dateProximityScore * 0.3));

          if (confidence > highestConfidence && confidence >= 50) {
            highestConfidence = confidence;
            bestMatch = internalTxn;
            
            // Compose Explanations
            if (confidence >= 85) {
              matchedCategory = 'ai_predicted';
              matchExplanation = `AI Map high-confidence link (${confidence}%). String similarity between "${bankTxn.description}" and "${internalTxn.description}" is ${nlpStringScore}%. Transacted within ${Math.round(diffInDays)} day(s).`;
            } else {
              matchedCategory = 'partial';
              matchExplanation = `Partial match (${confidence}%). Identical amount with minor description similarity: "${bankTxn.description}" vs "${internalTxn.description}" (${nlpStringScore}%) and date gap of ${Math.round(diffInDays)} day(s).`;
            }
          }
        }

        if (bestMatch) {
          matchedBankIds.add(bankTxn._id.toString());
          matchedInternalIds.add(bestMatch._id.toString());

          matchRecords.push({
            jobId,
            bankTransactionId: bankTxn._id,
            internalTransactionId: bestMatch._id,
            matchType: matchedCategory,
            confidenceScore: highestConfidence,
            explanation: matchExplanation,
            status: highestConfidence >= 85 ? 'auto_approved' : 'pending_review'
          });

          bankTxn.status = highestConfidence >= 85 ? 'reconciled' : 'discrepancy';
          bestMatch.status = highestConfidence >= 85 ? 'reconciled' : 'discrepancy';
          await bankTxn.save();
          await bestMatch.save();
        }
      }

      notifyJobUpdate(jobId, { status: 'processing', progress: 75, message: 'Classifying unmatched records and duplicates...' });

      // ==========================================
      // PASS 3: ORPHANED & UNMATCHED RECORDS
      // ==========================================
      // Write records for elements with no pairs
      const finalUnmatchedBank = bankTxns.filter(t => !matchedBankIds.has(t._id.toString()));
      for (const bankTxn of finalUnmatchedBank) {
        matchRecords.push({
          jobId,
          bankTransactionId: bankTxn._id,
          matchType: 'unmatched',
          confidenceScore: 0,
          explanation: 'No corresponding record found in internal ledger within amount and date bounds.',
          status: 'pending_review'
        });
      }

      const finalUnmatchedInternal = internalTxns.filter(t => !matchedInternalIds.has(t._id.toString()));
      for (const internalTxn of finalUnmatchedInternal) {
        matchRecords.push({
          jobId,
          internalTransactionId: internalTxn._id,
          matchType: 'unmatched',
          confidenceScore: 0,
          explanation: 'Internal record with no matching clearing item found in the bank statement.',
          status: 'pending_review'
        });
      }

      // 4. Save matches in DB
      if (matchRecords.length > 0) {
        await ReconciliationMatch.insertMany(matchRecords);
      }

      // ==========================================
      // STATS AGGREGATION & UPDATE
      // ==========================================
      const exactCount = matchRecords.filter(m => m.matchType === 'exact').length;
      const aiCount = matchRecords.filter(m => m.matchType === 'ai_predicted').length;
      const partialCount = matchRecords.filter(m => m.matchType === 'partial').length;
      const unmatchedCount = matchRecords.filter(m => m.matchType === 'unmatched').length;

      job.stats.matchedCount = exactCount + aiCount;
      job.stats.partialMatchedCount = partialCount;
      job.stats.unmatchedCount = unmatchedCount;
      job.stats.discrepancyCount = partialCount + unmatchedCount;
      job.status = 'completed';

      await job.save();

      notifyJobUpdate(jobId, { 
        status: 'completed', 
        progress: 100, 
        message: 'Reconciliation complete!',
        stats: job.stats
      });

      console.log(`✅ Reconciliation Engine completed. Total records processed: ${bankTxns.length + internalTxns.length}`);
      return job;

    } catch (error) {
      console.error('❌ Reconciliation processing failed:', error);
      job.status = 'failed';
      await job.save();
      notifyJobUpdate(jobId, { status: 'failed', progress: 100, message: `Failed: ${error.message}` });
      throw error;
    }
  }
}

module.exports = ReconciliationEngine;
