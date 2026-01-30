const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const { router: reconcileRoutes } = require('./routes/reconcile');
const auditRoutes = require('./routes/audit');

const app = express();

app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(config.MONGO_URI)
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

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});

