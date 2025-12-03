const express = require('express');
const router = express.Router();
const {
  getPackages,
  getStatus,
  purchaseCredits
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/packages', getPackages);

// Protected routes
router.get('/status', protect, getStatus);
router.post('/purchase', protect, purchaseCredits);

module.exports = router;

