const crypto = require('crypto');
const { getFirestore } = require('../config/firebase');

class EmailVerificationService {
  constructor() {
    this.collectionName = 'emailVerifications';
  }

  get db() {
    return getFirestore();
  }

  get verificationCollection() {
    return this.db.collection(this.collectionName);
  }

  // Generate a cryptographically secure random token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash token with SHA-256 for secure storage
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Create a verification token for a user
  async createVerificationToken(email, userId) {
    // First, invalidate any existing tokens for this email
    await this.invalidateExistingTokens(email);

    // Generate new token
    const token = this.generateVerificationToken();
    const tokenHash = this.hashToken(token);

    // Set expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (parseInt(process.env.EMAIL_VERIFICATION_EXPIRE_HOURS) || 24));

    // Store in Firestore
    const verificationDoc = {
      email: email.toLowerCase(),
      userId,
      tokenHash,
      expiresAt,
      createdAt: new Date(),
      verified: false
    };

    const docRef = await this.verificationCollection.add(verificationDoc);

    return {
      token, // Return unhashed token to be sent in email
      tokenId: docRef.id,
      expiresAt
    };
  }

  // Validate a verification token
  async validateVerificationToken(token) {
    const tokenHash = this.hashToken(token);

    // Find token in database
    const snapshot = await this.verificationCollection
      .where('tokenHash', '==', tokenHash)
      .where('verified', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false, error: 'Invalid or already used verification token' };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Check if token has expired
    const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
    if (new Date() > expiresAt) {
      return { valid: false, error: 'Verification token has expired' };
    }

    return {
      valid: true,
      tokenId: doc.id,
      email: data.email,
      userId: data.userId
    };
  }

  // Mark token as verified
  async markTokenVerified(tokenId) {
    await this.verificationCollection.doc(tokenId).update({
      verified: true,
      verifiedAt: new Date()
    });
  }

  // Invalidate all existing tokens for an email
  async invalidateExistingTokens(email) {
    const snapshot = await this.verificationCollection
      .where('email', '==', email.toLowerCase())
      .where('verified', '==', false)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { verified: true, invalidatedAt: new Date() });
    });

    if (!snapshot.empty) {
      await batch.commit();
    }
  }

  // Check rate limiting (max 5 verification emails per hour)
  async checkRateLimit(email) {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const snapshot = await this.verificationCollection
      .where('email', '==', email.toLowerCase())
      .where('createdAt', '>=', oneHourAgo)
      .get();

    const maxRequests = parseInt(process.env.EMAIL_VERIFICATION_MAX_REQUESTS) || 5;

    return {
      allowed: snapshot.size < maxRequests,
      remaining: Math.max(0, maxRequests - snapshot.size)
    };
  }

  // Clean up expired tokens (can be called periodically)
  async cleanupExpiredTokens() {
    const now = new Date();

    const snapshot = await this.verificationCollection
      .where('expiresAt', '<', now)
      .where('verified', '==', false)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    if (!snapshot.empty) {
      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} expired email verification tokens`);
    }

    return snapshot.size;
  }
}

module.exports = new EmailVerificationService();
