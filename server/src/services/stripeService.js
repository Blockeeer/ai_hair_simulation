const Stripe = require('stripe');

// Initialize Stripe with secret key (only if key is provided)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('✓ Stripe initialized successfully');
} else {
  console.warn('⚠ Stripe not configured - STRIPE_SECRET_KEY is missing. Payment features will be disabled.');
}

// Credit packages with Stripe price configuration
const STRIPE_PRODUCTS = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 199, // Price in cents ($1.99)
    currency: 'usd'
  },
  popular: {
    id: 'popular',
    name: 'Popular Pack',
    credits: 30,
    price: 499, // Price in cents ($4.99)
    currency: 'usd'
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    credits: 75,
    price: 999, // Price in cents ($9.99)
    currency: 'usd'
  },
  mega: {
    id: 'mega',
    name: 'Mega Pack',
    credits: 200,
    price: 1999, // Price in cents ($19.99)
    currency: 'usd'
  }
};

class StripeService {
  /**
   * Check if Stripe is configured
   * @returns {boolean}
   */
  isConfigured() {
    return stripe !== null;
  }

  /**
   * Create a Stripe Checkout Session for credit purchase
   * @param {string} packageId - The credit package ID
   * @param {string} userId - The user's ID
   * @param {string} userEmail - The user's email
   * @returns {Promise<Object>} - Checkout session object
   */
  async createCheckoutSession(packageId, userId, userEmail) {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }

    const product = STRIPE_PRODUCTS[packageId];

    if (!product) {
      throw new Error('Invalid package ID');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: `${product.credits} AI Hair Simulation Credits`,
              images: ['https://your-domain.com/credits-image.png'], // Optional: Add your credit icon URL
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/simulation?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/simulation?payment=cancelled`,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        packageId: packageId,
        credits: product.credits.toString()
      },
      // Expire session after 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    });

    return session;
  }

  /**
   * Verify and retrieve a checkout session
   * @param {string} sessionId - The Stripe session ID
   * @returns {Promise<Object>} - Session object with payment status
   */
  async getCheckoutSession(sessionId) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  }

  /**
   * Construct and verify webhook event
   * @param {Buffer} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} - Verified event object
   */
  constructWebhookEvent(payload, signature) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Get product details by package ID
   * @param {string} packageId - The package ID
   * @returns {Object|null} - Product details or null
   */
  getProduct(packageId) {
    return STRIPE_PRODUCTS[packageId] || null;
  }

  /**
   * Get all products
   * @returns {Object} - All products
   */
  getAllProducts() {
    return STRIPE_PRODUCTS;
  }
}

module.exports = new StripeService();
module.exports.STRIPE_PRODUCTS = STRIPE_PRODUCTS;
