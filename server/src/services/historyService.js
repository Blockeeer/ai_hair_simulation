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
      isFavorite: false,
      createdAt: new Date(),
    };

    const docRef = await this.historyCollection.add(doc);
    return { id: docRef.id, ...doc };
  }

  // Get all simulations for a user with pagination
  async getSimulationsByUser(userId, page = 1, limit = 12) {
    // Using only where clause to avoid composite index requirement
    // Sorting and pagination done in-memory
    const snapshot = await this.historyCollection
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) {
      return {
        simulations: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }

    const allResults = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Sort by createdAt descending in-memory
    allResults.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB - dateA;
    });

    // Calculate pagination
    const total = allResults.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Apply pagination
    const paginatedResults = allResults.slice(startIndex, endIndex);

    return {
      simulations: paginatedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
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

  // Toggle favorite status
  async toggleFavorite(simulationId, userId) {
    const doc = await this.historyCollection.doc(simulationId).get();

    if (!doc.exists) {
      throw new Error('Simulation not found');
    }

    const data = doc.data();

    // Verify ownership
    if (data.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const newFavoriteStatus = !data.isFavorite;
    await this.historyCollection.doc(simulationId).update({
      isFavorite: newFavoriteStatus
    });

    return {
      id: doc.id,
      ...data,
      isFavorite: newFavoriteStatus,
      createdAt: data.createdAt?.toDate?.() || data.createdAt
    };
  }

  // Get favorite simulations for a user
  async getFavorites(userId, limit = 50) {
    const snapshot = await this.historyCollection
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const results = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }))
      .filter(doc => doc.isFavorite === true);

    // Sort by createdAt descending
    results.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB - dateA;
    });

    return results.slice(0, limit);
  }
}

module.exports = new HistoryService();
