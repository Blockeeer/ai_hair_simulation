const stripeService = require('../services/stripeService');
const userService = require('../services/userService');

/**
 * @desc    Create Stripe checkout session
 * @route   POST /api/payment/create-checkout-session
 * @access  Private
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package ID is required'
      });
    }

    // Verify package exists
    const product = stripeService.getProduct(packageId);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID'
      });
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(packageId, userId, userEmail);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
};

/**
 * @desc    Verify payment and add credits
 * @route   POST /api/payment/verify-payment
 * @access  Private
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Get session from Stripe
    const session = await stripeService.getCheckoutSession(sessionId);

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Verify the session belongs to this user
    if (session.metadata.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Add credits atomically with session check to prevent double-crediting
    const creditsToAdd = parseInt(session.metadata.credits);
    const result = await userService.addCreditsWithSessionCheck(userId, creditsToAdd, sessionId);

    if (result.alreadyProcessed) {
      return res.json({
        success: true,
        message: 'Credits already added',
        alreadyProcessed: true,
        credits: result.credits
      });
    }

    res.json({
      success: true,
      message: `Successfully added ${creditsToAdd} credits!`,
      creditsAdded: creditsToAdd,
      newBalance: result.credits
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

/**
 * @desc    Handle Stripe webhook events
 * @route   POST /api/payment/webhook
 * @access  Public (verified by Stripe signature)
 */
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    const event = stripeService.constructWebhookEvent(req.body, signature);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Only process if payment is successful
        if (session.payment_status === 'paid') {
          const userId = session.metadata.userId;
          const creditsToAdd = parseInt(session.metadata.credits);
          const sessionId = session.id;

          // Add credits atomically with session check to prevent double-crediting
          const result = await userService.addCreditsWithSessionCheck(userId, creditsToAdd, sessionId);
          if (!result.alreadyProcessed) {
            console.log(`Webhook: Added ${creditsToAdd} credits to user ${userId}`);
          } else {
            console.log(`Webhook: Session ${sessionId} already processed for user ${userId}`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
};

/**
 * @desc    Get payment history for user
 * @route   GET /api/payment/history
 * @access  Private
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    // For now, return empty - could implement payment history storage later
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
};
