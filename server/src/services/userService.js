const { getFirestore, getAuth } = require('../config/firebase');
const bcrypt = require('bcryptjs');

// Subscription tiers configuration
const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    dailyLimit: 5,
    price: 0,
    features: ['5 generations per day', 'Basic AI models', 'Standard quality']
  },
  premium: {
    name: 'Premium',
    dailyLimit: 50,
    price: 9.99,
    features: ['50 generations per day', 'All AI models', 'HD quality', 'Priority processing', 'Save unlimited history']
  },
  unlimited: {
    name: 'Unlimited',
    dailyLimit: -1, // -1 means unlimited
    price: 19.99,
    features: ['Unlimited generations', 'All AI models', 'HD quality', 'Priority processing', 'Save unlimited history', 'Early access to new features']
  }
};

class UserService {
  get db() {
    return getFirestore();
  }

  get auth() {
    return getAuth();
  }

  get usersCollection() {
    return this.db.collection('users');
  }

  async createUser(userData) {
    const { email, password, username, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await this.findByEmailOrUsername(email, username);
    if (existingUser) {
      throw new Error(
        existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken'
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Firebase Auth user
    const firebaseUser = await this.auth.createUser({
      email,
      password,
      displayName: username
    });

    // Create user document in Firestore
    const userDoc = {
      uid: firebaseUser.uid,
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      profileImage: null,
      savedSimulations: [],
      createdAt: new Date(),
      lastLogin: null,
      isActive: true,
      emailVerified: false,
      // Subscription fields
      subscription: {
        tier: 'free',
        startDate: null,
        endDate: null,
        isActive: false
      },
      credits: 0 // Bonus credits that don't reset
    };

    await this.usersCollection.doc(firebaseUser.uid).set(userDoc);

    return this.getPublicProfile(userDoc);
  }

  async findByEmail(email) {
    const snapshot = await this.usersCollection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) {
      return null;
    }
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  async findByUsername(username) {
    const snapshot = await this.usersCollection.where('username', '==', username).limit(1).get();
    if (snapshot.empty) {
      return null;
    }
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  async findByEmailOrUsername(email, username) {
    const emailUser = await this.findByEmail(email);
    if (emailUser) return emailUser;

    const usernameUser = await this.findByUsername(username);
    return usernameUser;
  }

  async findById(uid) {
    const doc = await this.usersCollection.doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  async updateUser(uid, updates) {
    await this.usersCollection.doc(uid).update(updates);
    return await this.findById(uid);
  }

  async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  async updateLastLogin(uid) {
    await this.usersCollection.doc(uid).update({
      lastLogin: new Date()
    });
  }

  getPublicProfile(user) {
    const subscription = user.subscription || { tier: 'free', isActive: false };
    const tierInfo = SUBSCRIPTION_TIERS[subscription.tier] || SUBSCRIPTION_TIERS.free;

    return {
      id: user.id || user.uid,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      generationCount: user.generationCount || 0,
      lastGenerationReset: user.lastGenerationReset || null,
      subscription: {
        tier: subscription.tier || 'free',
        tierName: tierInfo.name,
        isActive: subscription.isActive || false,
        endDate: subscription.endDate || null,
        dailyLimit: tierInfo.dailyLimit,
        features: tierInfo.features
      },
      credits: user.credits || 0
    };
  }

  async markEmailVerified(userId) {
    await this.usersCollection.doc(userId).update({
      emailVerified: true,
      emailVerifiedAt: new Date()
    });
    return await this.findById(userId);
  }

  async getUserById(userId) {
    return await this.findById(userId);
  }

  // Get generation info with 24-hour reset and tier-based limits
  async getGenerationInfo(userId) {
    const user = await this.findById(userId);

    // Get user's subscription tier
    const subscription = user?.subscription || { tier: 'free', isActive: false };
    const tierInfo = SUBSCRIPTION_TIERS[subscription.tier] || SUBSCRIPTION_TIERS.free;

    // Check if premium subscription is still active
    let activeTier = 'free';
    if (subscription.tier !== 'free' && subscription.isActive) {
      const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
      if (endDate && endDate > new Date()) {
        activeTier = subscription.tier;
      } else {
        // Subscription expired, reset to free
        await this.usersCollection.doc(userId).update({
          'subscription.tier': 'free',
          'subscription.isActive': false
        });
      }
    }

    const currentTierInfo = SUBSCRIPTION_TIERS[activeTier];
    const dailyLimit = currentTierInfo.dailyLimit;
    const credits = user?.credits || 0;

    const lastResetTime = user?.lastGenerationReset ? new Date(user.lastGenerationReset) : null;
    const now = new Date();

    // Check if 24 hours have passed since last reset
    let currentCount = user?.generationCount || 0;
    let resetInHours = 24;

    if (lastResetTime) {
      const hoursSinceReset = (now - lastResetTime) / (1000 * 60 * 60);

      if (hoursSinceReset >= 24) {
        // Reset the count - 24 hours have passed
        currentCount = 0;
        await this.usersCollection.doc(userId).update({
          generationCount: 0,
          lastGenerationReset: now.toISOString()
        });
        resetInHours = 24;
      } else {
        // Calculate hours until reset
        resetInHours = Math.ceil(24 - hoursSinceReset);
      }
    }

    // Calculate remaining (unlimited tier returns -1 for unlimited)
    const isUnlimited = dailyLimit === -1;
    const remaining = isUnlimited ? -1 : Math.max(0, dailyLimit - currentCount);

    return {
      count: currentCount,
      limit: dailyLimit,
      remaining,
      resetInHours,
      isUnlimited,
      tier: activeTier,
      tierName: currentTierInfo.name,
      credits,
      totalAvailable: isUnlimited ? -1 : remaining + credits
    };
  }

  async incrementGenerationCount(userId) {
    const user = await this.findById(userId);
    const currentCount = user?.generationCount || 0;
    const lastResetTime = user?.lastGenerationReset ? new Date(user.lastGenerationReset) : null;
    const now = new Date();

    // Check if we need to reset (24 hours passed)
    if (lastResetTime) {
      const hoursSinceReset = (now - lastResetTime) / (1000 * 60 * 60);
      if (hoursSinceReset >= 24) {
        // Reset and set count to 1
        await this.usersCollection.doc(userId).update({
          generationCount: 1,
          lastGenerationReset: now.toISOString()
        });
        return 1;
      }
    } else {
      // First generation ever - set reset time
      await this.usersCollection.doc(userId).update({
        generationCount: 1,
        lastGenerationReset: now.toISOString()
      });
      return 1;
    }

    // Increment count
    const newCount = currentCount + 1;
    await this.usersCollection.doc(userId).update({
      generationCount: newCount
    });
    return newCount;
  }

  // Create or get user from Google OAuth
  async findOrCreateGoogleUser(googleUserData) {
    const { email, name, picture, sub: googleId } = googleUserData;

    // Check if user already exists by email
    let user = await this.findByEmail(email);

    if (user) {
      // User exists - update Google ID if not set and return
      if (!user.googleId) {
        await this.usersCollection.doc(user.id).update({
          googleId,
          profileImage: user.profileImage || picture
        });
        user = await this.findById(user.id);
      }
      return { user: this.getPublicProfile(user), isNewUser: false };
    }

    // Create new user from Google data
    // Generate a unique username from email
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    let username = baseUsername;
    let counter = 1;

    // Ensure username is unique
    while (await this.findByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Split name into first and last
    const nameParts = (name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create Firebase Auth user (or get existing)
    let firebaseUser;
    try {
      firebaseUser = await this.auth.getUserByEmail(email);
    } catch (error) {
      // User doesn't exist in Firebase Auth, create one
      firebaseUser = await this.auth.createUser({
        email,
        displayName: name,
        photoURL: picture,
        emailVerified: true
      });
    }

    // Create user document in Firestore
    const userDoc = {
      uid: firebaseUser.uid,
      username,
      email,
      password: null, // No password for Google users
      firstName,
      lastName,
      profileImage: picture || null,
      googleId,
      savedSimulations: [],
      createdAt: new Date(),
      lastLogin: new Date(),
      isActive: true,
      authProvider: 'google',
      emailVerified: true, // Google users are already verified
      // Subscription fields
      subscription: {
        tier: 'free',
        startDate: null,
        endDate: null,
        isActive: false
      },
      credits: 0
    };

    await this.usersCollection.doc(firebaseUser.uid).set(userDoc);

    return { user: this.getPublicProfile(userDoc), isNewUser: true };
  }

  // Subscription management methods
  async updateSubscription(userId, tier, durationMonths = 1) {
    if (!SUBSCRIPTION_TIERS[tier]) {
      throw new Error('Invalid subscription tier');
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    await this.usersCollection.doc(userId).update({
      subscription: {
        tier,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        isActive: true
      }
    });

    return await this.findById(userId);
  }

  async cancelSubscription(userId) {
    await this.usersCollection.doc(userId).update({
      'subscription.isActive': false
    });
    return await this.findById(userId);
  }

  async addCredits(userId, amount) {
    const user = await this.findById(userId);
    const currentCredits = user?.credits || 0;
    const newCredits = currentCredits + amount;

    await this.usersCollection.doc(userId).update({
      credits: newCredits
    });

    return newCredits;
  }

  async useCredit(userId) {
    const user = await this.findById(userId);
    const currentCredits = user?.credits || 0;

    if (currentCredits <= 0) {
      return false;
    }

    await this.usersCollection.doc(userId).update({
      credits: currentCredits - 1
    });

    return true;
  }

  getSubscriptionTiers() {
    return SUBSCRIPTION_TIERS;
  }
}

const userServiceInstance = new UserService();

module.exports = userServiceInstance;
module.exports.SUBSCRIPTION_TIERS = SUBSCRIPTION_TIERS;
