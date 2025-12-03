const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const hairRoutes = require('./hairRoutes');
const simulationRoutes = require('./simulationRoutes');
const historyRoutes = require('./historyRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/hair', hairRoutes);
router.use('/simulation', simulationRoutes);
router.use('/history', historyRoutes);
router.use('/subscription', subscriptionRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
