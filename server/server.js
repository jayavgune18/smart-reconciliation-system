const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

let config = {};
try {
  config = require('./config');
} catch (error) {
  console.log('config.js not found, using environment variables');
}

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
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
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
  console.log(`Server is running on port ${PORT}`);
});
