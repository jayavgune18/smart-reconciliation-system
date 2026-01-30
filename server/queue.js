const Queue = require('bull');
const { reconcileJob } = require('./routes/reconcile');
const UploadJob = require('./models/UploadJob');
const Record = require('./models/Record');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const config = require('./config');


// Initialize Bull Queue
const uploadQueue = new Queue('upload-processing', config.REDIS_URL);

uploadQueue.process(async (job) => {
  const { jobId, filePath, columnMapping } = job.data;
  console.log(`[Queue] Processing job ${jobId} (Job ID: ${job.id})`);

  try {
    const records = [];

    if (filePath.endsWith('.csv')) {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            try {
              records.push(mapRow(row, columnMapping));
            } catch (err) {
              console.error(`[Queue] Error mapping row in job ${jobId}:`, err.message);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = xlsx.utils.sheet_to_json(sheet);
      json.forEach(row => records.push(mapRow(row, columnMapping)));
    }

    await processRecords(records, jobId);

    console.log(`[Queue] Successfully completed job ${jobId}`);
  } catch (err) {
    console.error(`[Queue] Job ${jobId} failed:`, err);
    await UploadJob.findByIdAndUpdate(jobId, {
      status: 'Failed',
      errorDetails: err.message
    });
    throw err; // Bull will handle retries if configured
  }
});

async function processRecords(records, jobId) {
  // Idempotency: Clean previous records for this job
  await Record.deleteMany({ uploadJobId: jobId });

  // Batch insert for performance
  const BATCH_SIZE = 1000;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE).map(r => ({
      ...r,
      uploadJobId: jobId,
      isSystem: false
    }));
    await Record.insertMany(batch);
  }

  // Trigger reconciliation logic
  await reconcileJob(jobId);
  await UploadJob.findByIdAndUpdate(jobId, { status: 'Completed' });
}

function mapRow(row, mapping) {
  return {
    transactionId: String(row[mapping.transactionId] || row['Transaction ID'] || '').trim(),
    amount: parseFloat(row[mapping.amount] || row['Amount']) || 0,
    referenceNumber: String(row[mapping.referenceNumber] || row['Reference Number'] || '').trim(),
    date: row[mapping.date] || row['Date'] ? new Date(row[mapping.date] || row['Date']) : new Date()
  };
}

module.exports = uploadQueue;

