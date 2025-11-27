const express = require('express');
const router = express.Router();
const {
  saveSimulation,
  getHistory,
  getSimulation,
  deleteSimulation,
  getStats
} = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// POST /api/history - Save a simulation
router.post('/', saveSimulation);

// GET /api/history - Get user's simulation history
router.get('/', getHistory);

// GET /api/history/stats - Get user's stats
router.get('/stats', getStats);

// GET /api/history/:id - Get a single simulation
router.get('/:id', getSimulation);

// DELETE /api/history/:id - Delete a simulation
router.delete('/:id', deleteSimulation);

module.exports = router;
