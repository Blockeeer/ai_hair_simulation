const aiService = require('../services/aiService');

// Generate hair simulation
const generateSimulation = async (req, res) => {
  try {
    const { imageBase64, haircut, hair_color, gender } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    // Set defaults if not provided
    const options = {
      haircut: haircut || 'Random',
      hair_color: hair_color || 'Random',
      gender: gender || 'Auto-detect'
    };

    console.log('Generating simulation with options:', options);

    // Call AI Service (Replicate)
    const result = await aiService.changeHaircut(imageBase64, options);

    res.status(200).json({
      success: true,
      message: 'Simulation generated successfully',
      data: {
        originalImage: imageBase64,
        resultImage: result,
        options: options
      }
    });
  } catch (error) {
    console.error('Simulation generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate simulation'
    });
  }
};

// Check prediction status (deprecated - kept for backwards compatibility)
const checkStatus = async (req, res) => {
  try {
    res.status(200).json({
      success: false,
      message: 'Status checking not needed with current AI service implementation'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check prediction status'
    });
  }
};

module.exports = {
  generateSimulation,
  checkStatus
};
