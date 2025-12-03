const userService = require('../services/userService');
const { SUBSCRIPTION_TIERS } = require('../services/userService');

// @desc    Get all subscription tiers
// @route   GET /api/subscription/tiers
// @access  Public
exports.getTiers = async (req, res) => {
  try {
    res.json({
      success: true,
      data: SUBSCRIPTION_TIERS
    });
  } catch (error) {
    console.error('Get tiers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription tiers'
    });
  }
};

// @desc    Get current user's subscription status
// @route   GET /api/subscription/status
// @access  Private
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const generationInfo = await userService.getGenerationInfo(userId);
    const user = await userService.getUserById(userId);

    res.json({
      success: true,
      data: {
        tier: generationInfo.tier,
        tierName: generationInfo.tierName,
        isUnlimited: generationInfo.isUnlimited,
        dailyLimit: generationInfo.limit,
        generationsUsed: generationInfo.count,
        generationsRemaining: generationInfo.remaining,
        resetInHours: generationInfo.resetInHours,
        credits: generationInfo.credits,
        totalAvailable: generationInfo.totalAvailable,
        subscription: user?.subscription || { tier: 'free', isActive: false }
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription status'
    });
  }
};

// @desc    Upgrade subscription (mock - would integrate with payment provider)
// @route   POST /api/subscription/upgrade
// @access  Private
exports.upgrade = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier, paymentToken } = req.body;

    // Validate tier
    if (!SUBSCRIPTION_TIERS[tier] || tier === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription tier'
      });
    }

    // TODO: Integrate with payment provider (Stripe, PayPal, etc.)
    // For now, this is a mock implementation
    // In production, you would:
    // 1. Validate the payment token with your payment provider
    // 2. Process the payment
    // 3. Only update subscription if payment succeeds

    // Mock: Assume payment is successful
    const user = await userService.updateSubscription(userId, tier, 1);

    res.json({
      success: true,
      message: `Successfully upgraded to ${SUBSCRIPTION_TIERS[tier].name} plan!`,
      data: {
        subscription: user.subscription,
        user: userService.getPublicProfile(user)
      }
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error upgrading subscription'
    });
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscription/cancel
// @access  Private
exports.cancel = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.cancelSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription cancelled. You will retain access until the end of your billing period.',
      data: {
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription'
    });
  }
};

// @desc    Purchase credits
// @route   POST /api/subscription/credits/purchase
// @access  Private
exports.purchaseCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentToken } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credit amount'
      });
    }

    // Credit packages
    const creditPackages = {
      10: 4.99,
      25: 9.99,
      50: 17.99,
      100: 29.99
    };

    // TODO: Integrate with payment provider
    // For now, this is a mock implementation

    const newCredits = await userService.addCredits(userId, amount);

    res.json({
      success: true,
      message: `Successfully purchased ${amount} credits!`,
      data: {
        creditsAdded: amount,
        totalCredits: newCredits
      }
    });
  } catch (error) {
    console.error('Purchase credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error purchasing credits'
    });
  }
};

// @desc    Get credit packages
// @route   GET /api/subscription/credits/packages
// @access  Public
exports.getCreditPackages = async (req, res) => {
  try {
    const packages = [
      { credits: 10, price: 4.99, popular: false },
      { credits: 25, price: 9.99, popular: true },
      { credits: 50, price: 17.99, popular: false },
      { credits: 100, price: 29.99, popular: false }
    ];

    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Get credit packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching credit packages'
    });
  }
};
