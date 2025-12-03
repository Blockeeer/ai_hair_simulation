const userService = require('../services/userService');
const stripeService = require('../services/stripeService');
const { FREE_TIER, CREDIT_PACKAGES } = require('../services/userService');

// @desc    Get credit packages
// @route   GET /api/subscription/packages
// @access  Public
exports.getPackages = async (req, res) => {
  try {
    // Check if Stripe is configured
    const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

    res.json({
      success: true,
      data: {
        freeTier: FREE_TIER,
        packages: Object.values(CREDIT_PACKAGES),
        stripeEnabled
      }
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching credit packages'
    });
  }
};

// @desc    Get current user's generation status
// @route   GET /api/subscription/status
// @access  Private
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const generationInfo = await userService.getGenerationInfo(userId);

    res.json({
      success: true,
      data: {
        freeLimit: generationInfo.limit,
        generationsUsed: generationInfo.count,
        generationsRemaining: generationInfo.remaining,
        credits: generationInfo.credits,
        totalAvailable: generationInfo.totalAvailable
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching generation status'
    });
  }
};

// @desc    Purchase credits (Starter pack enabled for testing, others coming soon)
// @route   POST /api/subscription/purchase
// @access  Private
exports.purchaseCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.body;

    if (!packageId || !CREDIT_PACKAGES[packageId]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credit package'
      });
    }

    const pkg = CREDIT_PACKAGES[packageId];

    // Starter pack is enabled for testing - actually adds credits
    if (packageId === 'starter') {
      const result = await userService.purchaseCredits(userId, packageId);
      return res.json({
        success: true,
        message: `Successfully purchased ${result.package.credits} credits!`,
        data: {
          package: result.package,
          creditsAdded: result.package.credits,
          newBalance: result.newBalance
        }
      });
    }

    // Other packages show coming soon
    res.json({
      success: false,
      comingSoon: true,
      message: `Credit purchases coming soon! ${pkg.name} (${pkg.credits} credits for $${pkg.price}) will be available shortly.`
    });
  } catch (error) {
    console.error('Purchase credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error purchasing credits'
    });
  }
};
