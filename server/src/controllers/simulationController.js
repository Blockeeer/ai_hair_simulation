const aiService = require('../services/aiService');
const geminiService = require('../services/geminiService');
const queueService = require('../services/queueService');
const cacheService = require('../services/cacheService');
const crypto = require('crypto');
const userService = require('../services/userService');

// Generate hair simulation
const generateSimulation = async (req, res) => {
  const jobId = crypto.randomUUID();

  try {
    const { imageBase64, haircut, hair_color, gender, model, useCredit } = req.body;
    const userId = req.user?.id;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    let usedCredit = false;

    // Check generation limit for logged-in users
    if (userId) {
      const generationInfo = await userService.getGenerationInfo(userId);

      // Check if user has reached their free generation limit
      if (generationInfo.remaining <= 0) {
        // Check if user wants to use credits
        if (useCredit && generationInfo.credits > 0) {
          const creditUsed = await userService.useCredit(userId);
          if (creditUsed) {
            usedCredit = true;
          } else {
            return res.status(403).json({
              success: false,
              message: 'Failed to use credit',
              limitReached: true
            });
          }
        } else if (generationInfo.credits > 0) {
          // User has credits but didn't opt to use them
          return res.status(403).json({
            success: false,
            message: `You have used all ${generationInfo.limit} free generations. You have ${generationInfo.credits} credits available.`,
            limitReached: true,
            generationCount: generationInfo.count,
            limit: generationInfo.limit,
            credits: generationInfo.credits,
            canUseCredits: true
          });
        } else {
          return res.status(403).json({
            success: false,
            message: `You have used all ${generationInfo.limit} free generations. Buy credits for more!`,
            limitReached: true,
            generationCount: generationInfo.count,
            limit: generationInfo.limit,
            credits: 0,
            canUseCredits: false
          });
        }
      }
    }

    // Determine which model to use (default to gemini)
    const selectedModel = model || 'gemini';
    console.log('Using AI model:', selectedModel);

    // Check cache first
    const cacheParams = {
      imageBase64,
      haircut: haircut || (selectedModel === 'gemini' ? 'natural waves' : 'Random'),
      hairColor: hair_color || (selectedModel === 'gemini' ? 'natural' : 'Random'),
      aiModel: selectedModel,
      gender: gender || 'none'
    };

    const cacheCheck = await cacheService.isCached(cacheParams);

    let result;
    let fromCache = false;

    if (cacheCheck.isCached) {
      // Return cached result - no API call needed!
      console.log('Cache HIT - returning cached result');
      result = cacheCheck.cachedData.resultImageUrl;
      fromCache = true;
    } else {
      // No cache hit - call AI API
      // Add job to queue and get position info
      const queueInfo = queueService.addJob(jobId, userId || 'anonymous');
      console.log('Job ' + jobId + ' added to queue. Position: ' + queueInfo.position + ', Est. wait: ' + queueInfo.estimatedWaitTime + 's');

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

      // Cache the result for future requests
      await cacheService.cacheGeneration({
        ...cacheParams,
        imageHash: cacheCheck.imageHash
      }, result);
    }

    // Increment generation count for logged-in users (unless they used a credit or got cached result)
    // Note: Cached results still count as a generation to prevent abuse
    if (userId && !usedCredit) {
      await userService.incrementGenerationCount(userId);
    }

    // Get updated generation info
    const updatedGenerationInfo = userId ? await userService.getGenerationInfo(userId) : null;

    res.status(200).json({
      success: true,
      message: fromCache ? 'Simulation retrieved from cache' : 'Simulation generated successfully',
      data: {
        originalImage: imageBase64,
        resultImage: result,
        model: selectedModel,
        options: { haircut, hair_color, gender },
        usedCredit,
        generationInfo: updatedGenerationInfo,
        fromCache
      }
    });
  } catch (error) {
    // Remove job from queue (failure) - only if we started processing
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

    const { style, model, hairColor } = req.body;

    if (!style) {
      return res.status(400).json({
        success: false,
        message: 'Hairstyle is required'
      });
    }

    // Convert uploaded image to base64
    const imageBase64 = 'data:' + req.file.mimetype + ';base64,' + req.file.buffer.toString('base64');

    // Determine which model to use (default to gemini)
    const selectedModel = model || 'gemini';
    console.log('Trial using AI model:', selectedModel);

    // Add job to queue
    const queueInfo = queueService.addJob(jobId, 'trial-user');
    console.log('Trial job ' + jobId + ' added to queue. Position: ' + queueInfo.position);

    let result;

    if (selectedModel === 'gemini') {
      // Gemini style mapping
      const geminiStyleMap = {
        'natural-waves': 'natural waves',
        'buzz-cut': 'buzz cut',
        'fade': 'fade haircut',
        'pompadour': 'pompadour',
        'undercut': 'undercut',
        'bob-cut': 'bob cut',
        'pixie-cut': 'pixie cut',
        'quiff': 'quiff'
      };

      const options = {
        haircut: geminiStyleMap[style] || style.replace(/-/g, ' '),
        hair_color: hairColor || 'natural'
      };

      console.log('Generating trial simulation with Gemini, options:', options);
      result = await geminiService.changeHaircut(imageBase64, options);
    } else {
      // Replicate style mapping - exact options from flux-kontext-apps/change-haircut API
      const replicateStyleMap = {
        // Male styles
        'crew-cut': 'Crew Cut',
        'undercut': 'Undercut',
        'mohawk': 'Mohawk',
        'faux-hawk': 'Faux Hawk',
        'slicked-back': 'Slicked Back',
        // Female styles
        'bob': 'Bob',
        'pixie-cut': 'Pixie Cut',
        'wavy': 'Wavy',
        'layered': 'Layered',
        'lob': 'Lob',
        // Shared styles
        'curly': 'Curly',
        'straight': 'Straight'
      };

      // Replicate hair color mapping
      const replicateColorMap = {
        'no-change': 'No change',
        'random': 'Random',
        'blonde': 'Blonde',
        'brunette': 'Brunette',
        'black': 'Black',
        'red': 'Red',
        'platinum-blonde': 'Platinum Blonde',
        'auburn': 'Auburn'
      };

      const options = {
        haircut: replicateStyleMap[style] || 'Random',
        hair_color: replicateColorMap[hairColor] || 'Random',
        gender: 'none'
      };

      console.log('Generating trial simulation with Replicate, options:', options);
      result = await aiService.changeHaircut(imageBase64, options);
    }

    // Remove job from queue (success)
    queueService.removeJob(jobId, true);

    res.status(200).json({
      success: true,
      message: 'Trial simulation generated successfully',
      data: {
        generatedImageUrl: result,
        model: selectedModel
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
          limit: 3,
          remaining: 3,
          credits: 0,
          totalAvailable: 3
        }
      });
    }

    const generationInfo = await userService.getGenerationInfo(userId);

    res.status(200).json({
      success: true,
      data: {
        generationCount: generationInfo.count,
        limit: generationInfo.limit,
        remaining: generationInfo.remaining,
        credits: generationInfo.credits,
        totalAvailable: generationInfo.totalAvailable
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

// Get cache statistics (admin endpoint)
const getCacheStats = async (req, res) => {
  try {
    const stats = cacheService.getStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats'
    });
  }
};

module.exports = {
  generateSimulation,
  trialGenerate,
  getGenerationLimit,
  checkStatus,
  getQueueStatus,
  getCacheStats
};
