const historyService = require('../services/historyService');

// Save a simulation to history
const saveSimulation = async (req, res) => {
  try {
    const { originalImage, resultImage, haircut, hairColor, gender } = req.body;

    if (!originalImage || !resultImage) {
      return res.status(400).json({
        success: false,
        message: 'Original image and result image are required'
      });
    }

    const simulation = await historyService.saveSimulation(req.user.uid, {
      originalImage,
      resultImage,
      haircut: haircut || 'Random',
      hairColor: hairColor || 'Random',
      gender: gender || 'none'
    });

    res.status(201).json({
      success: true,
      message: 'Simulation saved successfully',
      data: simulation
    });
  } catch (error) {
    console.error('Save simulation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save simulation'
    });
  }
};

// Get user's simulation history
const getHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const simulations = await historyService.getSimulationsByUser(req.user.uid, limit);

    res.json({
      success: true,
      data: simulations,
      count: simulations.length
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history'
    });
  }
};

// Get a single simulation
const getSimulation = async (req, res) => {
  try {
    const { id } = req.params;
    const simulation = await historyService.getSimulationById(id, req.user.uid);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    res.json({
      success: true,
      data: simulation
    });
  } catch (error) {
    console.error('Get simulation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch simulation'
    });
  }
};

// Delete a simulation
const deleteSimulation = async (req, res) => {
  try {
    const { id } = req.params;
    await historyService.deleteSimulation(id, req.user.uid);

    res.json({
      success: true,
      message: 'Simulation deleted successfully'
    });
  } catch (error) {
    console.error('Delete simulation error:', error);

    if (error.message === 'Simulation not found') {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    if (error.message === 'Unauthorized') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this simulation'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete simulation'
    });
  }
};

// Get simulation count for stats
const getStats = async (req, res) => {
  try {
    const count = await historyService.getSimulationCount(req.user.uid);

    res.json({
      success: true,
      data: {
        totalSimulations: count
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};

module.exports = {
  saveSimulation,
  getHistory,
  getSimulation,
  deleteSimulation,
  getStats
};
