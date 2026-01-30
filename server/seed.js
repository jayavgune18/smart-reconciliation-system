const mongoose = require('mongoose');
const Record = require('./models/Record');
const MatchingRules = require('./models/MatchingRules');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const systemRecords = [
  { transactionId: 'TRX4001', amount: 1000, referenceNumber: 'REF4001', date: new Date('2024-11-01'), isSystem: true },
  { transactionId: 'TRX4002', amount: 1500, referenceNumber: 'REF4002', date: new Date('2024-11-02'), isSystem: true },
  { transactionId: 'TRX4003', amount: 2000, referenceNumber: 'REF4003', date: new Date('2024-11-03'), isSystem: true },
  { transactionId: 'TRX3001', amount: 1200, referenceNumber: 'REF3001', date: new Date('2024-11-01'), isSystem: true },
];

const defaultRules = [
  { ruleType: 'Exact', criteria: { fields: ['transactionId', 'amount'] } },
  { ruleType: 'Partial', criteria: { fields: ['referenceNumber'], variance: 0.05 } }, // 5% for trial
  { ruleType: 'Duplicate', criteria: { fields: ['transactionId'] } }
];

const seed = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await Record.deleteMany({ isSystem: true });
    await MatchingRules.deleteMany({});

    await Record.insertMany(systemRecords);
    await MatchingRules.insertMany(defaultRules);

    console.log('✅ Seeded system records and matching rules successfully');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    process.exit();
  }
};

seed();
