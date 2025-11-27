const { getFirestore } = require('../config/firebase');

class HistoryService {
  get db() {
    return getFirestore();
  }

  get historyCollection() {
    return this.db.collection('simulations');
  }

  // Save a simulation to history
  async saveSimulation(userId, simulationData) {
    const { originalImage, resultImage, haircut, hairColor, gender } = simulationData;

    const doc = {
      userId,
      originalImage, // base64 or URL
      resultImage,   // Replicate result URL
      haircut,
      hairColor,
      gender,
      createdAt: new Date(),
    };

    const docRef = await this.historyCollection.add(doc);
    return { id: docRef.id, ...doc };
  }

  // Get all simulations for a user
  async getSimulationsByUser(userId, limit = 20) {
    // Using only where clause to avoid composite index requirement
    // Sorting is done in-memory
    const snapshot = await this.historyCollection
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Sort by createdAt descending in-memory
    results.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB - dateA;
    });

    // Apply limit
    return results.slice(0, limit);
  }

  // Get a single simulation by ID
  async getSimulationById(simulationId, userId) {
    const doc = await this.historyCollection.doc(simulationId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    // Verify ownership
    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt
    };
  }

  // Delete a simulation
  async deleteSimulation(simulationId, userId) {
    const doc = await this.historyCollection.doc(simulationId).get();

    if (!doc.exists) {
      throw new Error('Simulation not found');
    }

    // Verify ownership
    if (doc.data().userId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.historyCollection.doc(simulationId).delete();
    return true;
  }

  // Get count of simulations for a user
  async getSimulationCount(userId) {
    const snapshot = await this.historyCollection
      .where('userId', '==', userId)
      .get();

    return snapshot.size;
  }
}

module.exports = new HistoryService();
