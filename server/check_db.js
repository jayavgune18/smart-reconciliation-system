const mongoose = require('mongoose');
const Record = require('./models/Record');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Check System Records
        const systemRecords = await Record.find({ isSystem: true });
        console.log(`Total System Records: ${systemRecords.length}`);
        systemRecords.forEach(r => {
            console.log(`- ${r.transactionId}: ${r.amount} (Ref: ${r.referenceNumber})`);
        });

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
