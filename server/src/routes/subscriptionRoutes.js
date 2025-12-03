const express = require('express');
const router = express.Router();
const {
  getTiers,
  getStatus,
  upgrade,
  cancel,
  purchaseCredits,
  getCreditPackages
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/tiers', getTiers);
router.get('/credits/packages', getCreditPackages);

// Protected routes
router.get('/status', protect, getStatus);
router.post('/upgrade', protect, upgrade);
router.post('/cancel', protect, cancel);
router.post('/credits/purchase', protect, purchaseCredits);

module.exports = router;
