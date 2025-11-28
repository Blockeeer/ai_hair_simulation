const aiService = require('../services/aiService');
const queueService = require('../services/queueService');
const crypto = require('crypto');

// Generate hair simulation
const generateSimulation = async (req, res) => {
  const jobId = crypto.randomUUID();

  try {
    const { imageBase64, haircut, hair_color, gender } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    // Add job to queue and get position info
    const queueInfo = queueService.addJob(jobId, userId);
    console.log(`Job ${jobId} added to queue. Position: ${queueInfo.position}, Est. wait: ${queueInfo.estimatedWaitTime}s`);

    // Set defaults if not provided (must match Replicate API accepted values)
    const options = {
      haircut: haircut || 'Random',
      hair_color: hair_color || 'Random',
      gender: gender || 'none'
    };

    console.log('Generating simulation with options:', options);

    // Call AI Service (Replicate)
    const result = await aiService.changeHaircut(imageBase64, options);

    // Remove job from queue (success)
    queueService.removeJob(jobId, true);

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
    // Remove job from queue (failure)
    queueService.removeJob(jobId, false);

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

// Get current queue status
const getQueueStatus = async (req, res) => {
  try {
    const status = queueService.getQueueStatus();

    res.status(200).json({
      success: true,
      data: {
        activeJobs: status.activeJobs,
        averageProcessingTime: status.averageProcessingTime,
        estimatedWaitTime: status.estimatedWaitForNewJob,
        formattedWaitTime: formatWaitTime(status.estimatedWaitForNewJob)
      }
    });
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue status'
    });
  }
};

// Helper function to format wait time
function formatWaitTime(seconds) {
  if (seconds < 60) {
    return `~${Math.round(seconds)} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `~${hours}h ${minutes}m`;
  }
}

module.exports = {
  generateSimulation,
  checkStatus,
  getQueueStatus
};
