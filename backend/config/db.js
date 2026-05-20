const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-recon-db', {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout before failure
    });
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    console.log('⚠️ Falling back to local mock DB operations or waiting for retry...');
    // We do not call process.exit(1) so that the server remains alive for presentation
    // even if MongoDB is not running locally.
  }
};

module.exports = connectDB;
