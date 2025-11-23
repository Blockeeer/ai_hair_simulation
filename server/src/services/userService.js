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
      isActive: true
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
      createdAt: user.createdAt
    };
  }
}

module.exports = new UserService();
