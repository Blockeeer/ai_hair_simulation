const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generateSimulation, checkStatus, getQueueStatus, trialGenerate, getGenerationLimit } = require('../controllers/simulationController');
const { protect } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Public route - trial generation (no auth required)
router.post('/trial-generate', upload.single('image'), trialGenerate);

// Protected routes
router.post('/generate', protect, generateSimulation);
router.get('/status/:predictionId', protect, checkStatus);
router.get('/queue-status', protect, getQueueStatus);
router.get('/generation-limit', protect, getGenerationLimit);

module.exports = router;
