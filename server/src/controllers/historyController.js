const historyService = require('../services/historyService');
const storageService = require('../services/storageService');

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

    console.log('Uploading images to Cloudinary...');

    // Upload both images to Cloudinary for permanent storage
    let permanentOriginalImage = originalImage;
    let permanentResultImage = resultImage;

    try {
      // Upload original image to Cloudinary
      permanentOriginalImage = await storageService.uploadImage(
        originalImage,
        req.user.uid,
        'original'
      );
      console.log('✓ Original image uploaded to Cloudinary');

      // Upload result image to Cloudinary (handles Replicate URLs)
      permanentResultImage = await storageService.uploadImage(
        resultImage,
        req.user.uid,
        'result'
      );
      console.log('✓ Result image uploaded to Cloudinary');
    } catch (uploadError) {
      console.error('Failed to upload to Cloudinary:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload images to storage'
      });
    }

    const simulation = await historyService.saveSimulation(req.user.uid, {
      originalImage: permanentOriginalImage,
      resultImage: permanentResultImage,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const result = await historyService.getSimulationsByUser(req.user.uid, page, limit);

    res.json({
      success: true,
      data: result.simulations,
      pagination: result.pagination
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

// Toggle favorite status
const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const simulation = await historyService.toggleFavorite(id, req.user.uid);

    res.json({
      success: true,
      message: simulation.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      data: simulation
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);

    if (error.message === 'Simulation not found') {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    if (error.message === 'Unauthorized') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify this simulation'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to toggle favorite'
    });
  }
};

// Get user's favorite simulations
const getFavorites = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const favorites = await historyService.getFavorites(req.user.uid, limit);

    res.json({
      success: true,
      data: favorites,
      count: favorites.length
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites'
    });
  }
};

module.exports = {
  saveSimulation,
  getHistory,
  getSimulation,
  deleteSimulation,
  getStats,
  toggleFavorite,
  getFavorites
};
