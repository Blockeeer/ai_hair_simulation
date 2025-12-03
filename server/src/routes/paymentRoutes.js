const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  verifyPayment,
  handleWebhook,
  getPaymentHistory
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Webhook route - must use raw body parser (configured in app.js)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/verify-payment', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
