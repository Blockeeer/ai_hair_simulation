const aiService = require('../services/aiService');
const geminiService = require('../services/geminiService');
const queueService = require('../services/queueService');
const crypto = require('crypto');
const userService = require('../services/userService');

// Generation limits
const TRIAL_LIMIT = 2;  // Non-logged-in users
const USER_LIMIT = 5;   // Logged-in users (verified or not)

// Generate hair simulation
const generateSimulation = async (req, res) => {
  const jobId = crypto.randomUUID();

  try {
    const { imageBase64, haircut, hair_color, gender, model } = req.body;
    const userId = req.user?.id;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    // Check generation limit for logged-in users
    if (userId) {
      const user = await userService.getUserById(userId);
      const generationCount = user?.generationCount || 0;

      if (generationCount >= USER_LIMIT) {
        return res.status(403).json({
          success: false,
          message: `You have reached your daily limit of ${USER_LIMIT} generations. Please try again tomorrow.`,
          limitReached: true,
          generationCount,
          limit: USER_LIMIT
        });
      }
    }

    // Add job to queue and get position info
    const queueInfo = queueService.addJob(jobId, userId || 'anonymous');
    console.log('Job ' + jobId + ' added to queue. Position: ' + queueInfo.position + ', Est. wait: ' + queueInfo.estimatedWaitTime + 's');

    // Determine which model to use (default to replicate)
    const selectedModel = model || 'replicate';
    console.log('Using AI model:', selectedModel);

    let result;

    if (selectedModel === 'gemini') {
      // Use Gemini AI
      const options = {
        haircut: haircut || 'natural waves',
        hair_color: hair_color || 'natural'
      };
      console.log('Generating simulation with Gemini, options:', options);
      result = await geminiService.changeHaircut(imageBase64, options);
    } else {
      // Use Replicate (default)
      const options = {
        haircut: haircut || 'Random',
        hair_color: hair_color || 'Random',
        gender: gender || 'none'
      };
      console.log('Generating simulation with Replicate, options:', options);
      result = await aiService.changeHaircut(imageBase64, options);
    }

    // Remove job from queue (success)
    queueService.removeJob(jobId, true);

    // Increment generation count for logged-in users
    if (userId) {
      await userService.incrementGenerationCount(userId);
    }

    res.status(200).json({
      success: true,
      message: 'Simulation generated successfully',
      data: {
        originalImage: imageBase64,
        resultImage: result,
        model: selectedModel,
        options: { haircut, hair_color, gender }
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

// Trial generation for non-logged-in users (landing page)
const trialGenerate = async (req, res) => {
  const jobId = crypto.randomUUID();

  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    const { style } = req.body;

    if (!style) {
      return res.status(400).json({
        success: false,
        message: 'Hairstyle is required'
      });
    }

    // Convert uploaded image to base64
    const imageBase64 = 'data:' + req.file.mimetype + ';base64,' + req.file.buffer.toString('base64');

    // Map style ID to haircut name
    const styleMap = {
      'buzz-cut': 'Buzz Cut',
      'fade': 'Fade',
      'pompadour': 'Pompadour',
      'curly': 'Curly',
      'long-straight': 'Long and Straight',
      'bob': 'Bob'
    };

    const options = {
      haircut: styleMap[style] || 'Random',
      hair_color: 'Random',
      gender: 'none'
    };

    // Add job to queue
    const queueInfo = queueService.addJob(jobId, 'trial-user');
    console.log('Trial job ' + jobId + ' added to queue. Position: ' + queueInfo.position);

    console.log('Generating trial simulation with options:', options);

    // Call AI Service
    const result = await aiService.changeHaircut(imageBase64, options);

    // Remove job from queue (success)
    queueService.removeJob(jobId, true);

    res.status(200).json({
      success: true,
      message: 'Trial simulation generated successfully',
      data: {
        generatedImageUrl: result
      }
    });
  } catch (error) {
    // Remove job from queue (failure)
    queueService.removeJob(jobId, false);

    console.error('Trial simulation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate simulation'
    });
  }
};

// Get user's generation count and limit
const getGenerationLimit = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(200).json({
        success: true,
        data: {
          generationCount: 0,
          limit: USER_LIMIT,
          remaining: USER_LIMIT
        }
      });
    }

    const user = await userService.getUserById(userId);
    const generationCount = user?.generationCount || 0;

    res.status(200).json({
      success: true,
      data: {
        generationCount,
        limit: USER_LIMIT,
        remaining: Math.max(0, USER_LIMIT - generationCount)
      }
    });
  } catch (error) {
    console.error('Get generation limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get generation limit'
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
    return '~' + Math.round(seconds) + ' seconds';
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return '~' + minutes + ' minute' + (minutes > 1 ? 's' : '');
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return '~' + hours + 'h ' + minutes + 'm';
  }
}

module.exports = {
  generateSimulation,
  trialGenerate,
  getGenerationLimit,
  checkStatus,
  getQueueStatus
};
