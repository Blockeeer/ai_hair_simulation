const { getFirestore, getAuth } = require('../config/firebase');
const bcrypt = require('bcryptjs');

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
      emailVerified: false
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
    return {
      id: user.id || user.uid,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified || false
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

  async incrementGenerationCount(userId) {
    const user = await this.findById(userId);
    const currentCount = user?.generationCount || 0;
    const lastGenerationDate = user?.lastGenerationDate;
    const today = new Date().toDateString();

    // Reset count if it's a new day
    if (lastGenerationDate !== today) {
      await this.usersCollection.doc(userId).update({
        generationCount: 1,
        lastGenerationDate: today
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
      emailVerified: true // Google users are already verified
    };

    await this.usersCollection.doc(firebaseUser.uid).set(userDoc);

    return { user: this.getPublicProfile(userDoc), isNewUser: true };
  }
}

module.exports = new UserService();
