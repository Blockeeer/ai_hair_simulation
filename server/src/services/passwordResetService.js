const crypto = require('crypto');
const { getFirestore } = require('../config/firebase');

class PasswordResetService {
  constructor() {
    this.collectionName = 'passwordResets';
  }

  get db() {
    return getFirestore();
  }

  get resetTokensCollection() {
    return this.db.collection(this.collectionName);
  }

  // Generate a cryptographically secure random token
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash token with SHA-256 for secure storage
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Create a password reset token for a user
  async createResetToken(email, userId) {
    // First, invalidate any existing tokens for this email
    await this.invalidateExistingTokens(email);

    // Generate new token
    const token = this.generateResetToken();
    const tokenHash = this.hashToken(token);

    // Set expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (parseInt(process.env.PASSWORD_RESET_EXPIRE_HOURS) || 1));

    // Store in Firestore
    const resetDoc = {
      email: email.toLowerCase(),
      userId,
      tokenHash,
      expiresAt,
      createdAt: new Date(),
      used: false
    };

    const docRef = await this.resetTokensCollection.add(resetDoc);

    return {
      token, // Return unhashed token to be sent in email
      tokenId: docRef.id,
      expiresAt
    };
  }

  // Validate a reset token
  async validateResetToken(token) {
    const tokenHash = this.hashToken(token);

    // Find token in database
    const snapshot = await this.resetTokensCollection
      .where('tokenHash', '==', tokenHash)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false, error: 'Invalid or expired reset token' };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Check if token has expired
    const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
    if (new Date() > expiresAt) {
      return { valid: false, error: 'Reset token has expired' };
    }

    return {
      valid: true,
      tokenId: doc.id,
      email: data.email,
      userId: data.userId
    };
  }

  // Mark token as used
  async markTokenUsed(tokenId) {
    await this.resetTokensCollection.doc(tokenId).update({
      used: true,
      usedAt: new Date()
    });
  }

  // Invalidate all existing tokens for an email
  async invalidateExistingTokens(email) {
    const snapshot = await this.resetTokensCollection
      .where('email', '==', email.toLowerCase())
      .where('used', '==', false)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { used: true, invalidatedAt: new Date() });
    });

    if (!snapshot.empty) {
      await batch.commit();
    }
  }

  // Check rate limiting (max 3 requests per hour per email)
  async checkRateLimit(email) {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const snapshot = await this.resetTokensCollection
      .where('email', '==', email.toLowerCase())
      .where('createdAt', '>=', oneHourAgo)
      .get();

    const maxRequests = parseInt(process.env.PASSWORD_RESET_MAX_REQUESTS) || 3;

    return {
      allowed: snapshot.size < maxRequests,
      remaining: Math.max(0, maxRequests - snapshot.size),
      resetTime: oneHourAgo
    };
  }

  // Clean up expired tokens (can be called periodically)
  async cleanupExpiredTokens() {
    const now = new Date();

    const snapshot = await this.resetTokensCollection
      .where('expiresAt', '<', now)
      .where('used', '==', false)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    if (!snapshot.empty) {
      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} expired password reset tokens`);
    }

    return snapshot.size;
  }
}

module.exports = new PasswordResetService();
