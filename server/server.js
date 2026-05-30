const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const houseRoutes = require('./routes/house');
const budgetRoutes = require('./routes/budget');
const paymentRoutes = require('./routes/payment');
const rentRoutes = require('./routes/rent');
const statisticsRoutes = require('./routes/statistics');
const bookRoutes = require('./routes/book');
const settlementRoutes = require('./routes/settlement');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve built React app
const clientBuild = path.join(__dirname, '../client/build');
app.use(express.static(clientBuild));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/houses', budgetRoutes);
app.use('/api/houses', paymentRoutes);
app.use('/api/houses', rentRoutes);
app.use('/api/houses', statisticsRoutes);
app.use('/api/houses', bookRoutes);
app.use('/api/houses', settlementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Catch-all: serve React app for any non-API route
app.use((req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

// Connect to MongoDB
const PORT = process.env.PORT || 4040;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/monthlybudget';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

module.exports = app;
