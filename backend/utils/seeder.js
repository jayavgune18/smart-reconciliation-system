require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ReconciliationJob = require('../models/ReconciliationJob');
const ReconciliationMatch = require('../models/ReconciliationMatch');
const AuditLog = require('../models/AuditLog');
const { calculateIntelligentScore } = require('./similarity');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-recon-db';
    console.log('🌱 Starting DB Seeding on:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('🔌 Connected to MongoDB...');

    // Clear collections
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await ReconciliationJob.deleteMany({});
    await ReconciliationMatch.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('🧹 Purged existing database tables...');

    // 1. Create Default Accounts
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('admin123', salt);
    const hashedUserPassword = await bcrypt.hash('user123', salt);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@recon.com',
      password: 'admin123', // Model hook will hash if we use standard creation or let it go
      role: 'admin'
    });

    const user = await User.create({
      name: 'Reconciliation Officer',
      email: 'user@recon.com',
      password: 'user123',
      role: 'user'
    });

    console.log('👤 Seeded Default Credentials:');
    console.log('   - Admin: admin@recon.com / admin123');
    console.log('   - User : user@recon.com / user123');

    // 2. Create Job
    const job = await ReconciliationJob.create({
      name: 'Q1 Global Statement Audit',
      status: 'completed',
      createdBy: admin._id
    });

    console.log(`💼 Seeded Reconciliation Job: "${job.name}"`);

    // 3. Generate Transactions Data (Bank Statement & Internal Ledger)
    const baseDate = new Date();

    const bankRecords = [
      // Exact Matches
      { transactionId: 'TXN10001', amount: 1500.00, date: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), description: 'Salary Credit - Acct Transfer' },
      { transactionId: 'TXN10002', amount: -4500.00, date: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000), description: 'Google Cloud Platform Invoices' },
      { transactionId: 'TXN10003', amount: -75.50, date: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000), description: 'Amazon Web Services AWS' },
      
      // Fuzzy/AI matches (mismatched descriptions or slight dates)
      { transactionId: '', amount: -150.00, date: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000), description: 'AMAZONPAY INDIA PRIVATE' }, // Matches with "Amazon Pay"
      { transactionId: '', amount: -45.00, date: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), description: 'GPAY / GOOGLE PAY IND' },      // Matches with "GPay Transfer"
      { transactionId: 'TXN10006', amount: -12.00, date: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000), description: 'NETFLIX PREMIUM SUBSCRIPTION' }, // Matches with "Netflix"
      
      // Duplicates / Fraud triggers
      { transactionId: 'TXN10007', amount: -500.00, date: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000), description: 'ATM Withdrawal - Cash' },
      { transactionId: 'TXN10008', amount: -500.00, date: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000), description: 'ATM Withdrawal - Cash' }, // Same amount, date, description - Duplication!

      // Unmatched bank entries
      { transactionId: 'TXN10009', amount: -1200.00, date: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000), description: 'Suspicious Wire Transfer Out' }
    ];

    const internalRecords = [
      // Exact matches
      { transactionId: 'TXN10001', amount: 1500.00, date: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), description: 'Salary Credit - Acct Transfer' },
      { transactionId: 'TXN10002', amount: -4500.00, date: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000), description: 'Google Cloud Platform Invoices' },
      { transactionId: 'TXN10003', amount: -75.50, date: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000), description: 'Amazon Web Services AWS' },
      
      // Fuzzy target pairings
      { transactionId: '', amount: -150.00, date: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000), description: 'Amazon Pay' },
      { transactionId: '', amount: -45.00, date: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), description: 'GPay Transfer' },
      { transactionId: 'TXN10006', amount: -12.00, date: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000), description: 'Netflix Card charge' },
      
      // Single cash record (Only one entered internally but debited twice by bank!)
      { transactionId: 'TXN10007', amount: -500.00, date: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000), description: 'ATM Withdrawal - Cash' },

      // Unmatched internal entry
      { transactionId: 'TXN10010', amount: -320.00, date: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000), description: 'Office Stationery Purchase' }
    ];

    // Save Transactions
    const bankTxnsToSave = bankRecords.map(r => ({ ...r, source: 'bank', uploadJobId: job._id, status: 'unreconciled' }));
    const internalTxnsToSave = internalRecords.map(r => ({ ...r, source: 'internal', uploadJobId: job._id, status: 'unreconciled' }));

    const savedBank = await Transaction.insertMany(bankTxnsToSave);
    const savedInternal = await Transaction.insertMany(internalTxnsToSave);
    console.log(`📊 Ingested ${savedBank.length} Bank records and ${savedInternal.length} Internal records...`);

    // 4. Map & Link Reconciliations Programmatically
    const matches = [];

    // Link Perfect Exact Matches
    const exactIds = ['TXN10001', 'TXN10002', 'TXN10003'];
    for (const id of exactIds) {
      const b = savedBank.find(t => t.transactionId === id);
      const i = savedInternal.find(t => t.transactionId === id);
      if (b && i) {
        b.status = 'reconciled';
        i.status = 'reconciled';
        await b.save();
        await i.save();

        matches.push({
          jobId: job._id,
          bankTransactionId: b._id,
          internalTransactionId: i._id,
          matchType: 'exact',
          confidenceScore: 100,
          explanation: `Deterministic match. Exact reference match: "${id}" with equal date/amount.`,
          status: 'auto_approved'
        });
      }
    }

    // Link Fuzzy Pair 1 (Amazon Pay)
    const bAmz = savedBank.find(t => t.description === 'AMAZONPAY INDIA PRIVATE');
    const iAmz = savedInternal.find(t => t.description === 'Amazon Pay');
    if (bAmz && iAmz) {
      const score = calculateIntelligentScore(bAmz.description, iAmz.description);
      bAmz.status = 'reconciled';
      iAmz.status = 'reconciled';
      await bAmz.save();
      await iAmz.save();

      matches.push({
        jobId: job._id,
        bankTransactionId: bAmz._id,
        internalTransactionId: iAmz._id,
        matchType: 'ai_predicted',
        confidenceScore: score,
        explanation: `AI-Assisted match (${score}% confidence). Character N-gram matched "AMAZONPAY INDIA PRIVATE" to internal record "Amazon Pay". Amount matched exactly.`,
        status: 'auto_approved'
      });
    }

    // Link Fuzzy Pair 2 (Google Pay)
    const bGpay = savedBank.find(t => t.description === 'GPAY / GOOGLE PAY IND');
    const iGpay = savedInternal.find(t => t.description === 'GPay Transfer');
    if (bGpay && iGpay) {
      const score = calculateIntelligentScore(bGpay.description, iGpay.description);
      bGpay.status = 'reconciled';
      iGpay.status = 'reconciled';
      await bGpay.save();
      await iGpay.save();

      matches.push({
        jobId: job._id,
        bankTransactionId: bGpay._id,
        internalTransactionId: iGpay._id,
        matchType: 'ai_predicted',
        confidenceScore: score,
        explanation: `AI-Assisted match (${score}% confidence). Fuzzy string mapped "GPAY / GOOGLE PAY IND" to "GPay Transfer".`,
        status: 'auto_approved'
      });
    }

    // Link Fuzzy Pair 3 (Netflix)
    const bNet = savedBank.find(t => t.description === 'NETFLIX PREMIUM SUBSCRIPTION');
    const iNet = savedInternal.find(t => t.description === 'Netflix Card charge');
    if (bNet && iNet) {
      const score = calculateIntelligentScore(bNet.description, iNet.description);
      bNet.status = 'reconciled';
      iNet.status = 'reconciled';
      await bNet.save();
      await iNet.save();

      matches.push({
        jobId: job._id,
        bankTransactionId: bNet._id,
        internalTransactionId: iNet._id,
        matchType: 'ai_predicted',
        confidenceScore: score,
        explanation: `AI-Assisted match (${score}% confidence). Character overlap matching resolved Netflix records automatically.`,
        status: 'auto_approved'
      });
    }

    // Link Cash ATM Withdrawal
    const bAtm1 = savedBank.find(t => t.transactionId === 'TXN10007');
    const bAtm2 = savedBank.find(t => t.transactionId === 'TXN10008'); // Duplicate
    const iAtm = savedInternal.find(t => t.transactionId === 'TXN10007');

    if (bAtm1 && iAtm) {
      bAtm1.status = 'reconciled';
      iAtm.status = 'reconciled';
      await bAtm1.save();
      await iAtm.save();

      matches.push({
        jobId: job._id,
        bankTransactionId: bAtm1._id,
        internalTransactionId: iAtm._id,
        matchType: 'exact',
        confidenceScore: 100,
        explanation: 'Deterministic ID match.',
        status: 'auto_approved'
      });
    }

    // Unmatched Bank Wire
    const bWire = savedBank.find(t => t.transactionId === 'TXN10009');
    if (bWire) {
      bWire.status = 'discrepancy';
      await bWire.save();
      matches.push({
        jobId: job._id,
        bankTransactionId: bWire._id,
        matchType: 'unmatched',
        confidenceScore: 0,
        explanation: 'Suspicious Bank Debit of $1200.00 with no matching entry logged inside internal ledger.',
        status: 'pending_review'
      });
    }

    // Unmatched Internal Stationery
    const iStat = savedInternal.find(t => t.transactionId === 'TXN10010');
    if (iStat) {
      iStat.status = 'discrepancy';
      await iStat.save();
      matches.push({
        jobId: job._id,
        internalTransactionId: iStat._id,
        matchType: 'unmatched',
        confidenceScore: 0,
        explanation: 'Internal invoice filed for $320.00 but no clearing payment was recorded in the bank statement.',
        status: 'pending_review'
      });
    }

    // Write matches
    await ReconciliationMatch.insertMany(matches);

    // Update job statistics
    job.stats = {
      totalBank: savedBank.length,
      totalInternal: savedInternal.length,
      matchedCount: exactIds.length + 3 + 1, // exacts + fuzzies + cash
      partialMatchedCount: 0,
      unmatchedCount: 2,
      discrepancyCount: 2
    };
    await job.save();

    // 5. Create Audit Trail Logs
    await AuditLog.create([
      {
        userId: admin._id,
        action: 'DB_BOOTSTRAP',
        details: { description: 'Reconciliation database bootstrapped via Seeder utility.' },
        ipAddress: '127.0.0.1'
      },
      {
        userId: admin._id,
        action: 'STATEMENT_INGESTION',
        details: {
          jobId: job._id,
          jobName: job.name,
          bankRecordsCount: savedBank.length,
          internalRecordsCount: savedInternal.length,
          fraudFlags: 1
        },
        ipAddress: '127.0.0.1'
      }
    ]);

    console.log('✅ Seed Database completed successfully!');
    console.log('👋 Seeder shut down safely.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeder execution failed:', error);
    process.exit(1);
  }
};

seedDB();
