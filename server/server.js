const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

let config = {};
try {
  config = require('./config');
} catch (error) {
  console.log('config.js not found or error loading it, using environment variables');
}

// Health check route for deployment platforms
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date(), environment: process.env.NODE_ENV });
});

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const { router: reconcileRoutes } = require('./routes/reconcile');
const auditRoutes = require('./routes/audit');

const app = express();

app.use(cors());
app.use(express.json());

// Environment Variables with Fallbacks
const PORT = process.env.PORT || config.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || config.MONGO_URI;

// Database connection
if (!MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log('DB Host:', mongoose.connection.host);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failure!');
    console.error('Error details:', err.message);
    console.error('Check if your MONGO_URI is correct and your IP is whitelisted (if using Atlas).');
    // In some environments, we might want to stay alive even if DB is down initially, 
    // but for this app the DB is critical.
    process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reconcile', reconcileRoutes);
app.use('/api/audit', auditRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Catch-all handler to serve React's index.html for any request that doesn't match API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server initialized on stage: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Listening at http://0.0.0.0:${PORT}`);
}).on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
