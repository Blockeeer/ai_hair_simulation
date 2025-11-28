const express = require('express');
const router = express.Router();
const { generateSimulation, checkStatus, getQueueStatus } = require('../controllers/simulationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.post('/generate', protect, generateSimulation);
router.get('/status/:predictionId', protect, checkStatus);
router.get('/queue-status', protect, getQueueStatus);

module.exports = router;
