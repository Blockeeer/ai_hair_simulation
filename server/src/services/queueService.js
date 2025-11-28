/**
 * Queue Service - Tracks active AI generation requests for wait time estimation
 */

class QueueService {
  constructor() {
    // Active generation jobs
    this.activeJobs = new Map();
    // Average processing time in seconds (starts with estimate, updates based on actual times)
    this.averageProcessingTime = 30;
    // Historical processing times for averaging
    this.processingTimes = [];
    this.maxHistorySize = 50;
  }

  /**
   * Add a job to the queue
   * @param {string} jobId - Unique job identifier
   * @param {string} userId - User who initiated the job
   * @returns {object} Queue position info
   */
  addJob(jobId, userId) {
    const job = {
      id: jobId,
      userId,
      startTime: Date.now(),
      status: 'processing'
    };

    this.activeJobs.set(jobId, job);

    const position = this.activeJobs.size;
    const estimatedWaitTime = this.calculateEstimatedWaitTime(position);

    return {
      jobId,
      position,
      estimatedWaitTime,
      totalInQueue: this.activeJobs.size
    };
  }

  /**
   * Remove a job from the queue (completed or failed)
   * @param {string} jobId - Job identifier
   * @param {boolean} success - Whether job completed successfully
   */
  removeJob(jobId, success = true) {
    const job = this.activeJobs.get(jobId);

    if (job && success) {
      // Calculate actual processing time and update average
      const processingTime = (Date.now() - job.startTime) / 1000;
      this.updateAverageProcessingTime(processingTime);
    }

    this.activeJobs.delete(jobId);
  }

  /**
   * Get current queue status
   * @returns {object} Queue status info
   */
  getQueueStatus() {
    return {
      activeJobs: this.activeJobs.size,
      averageProcessingTime: Math.round(this.averageProcessingTime),
      estimatedWaitForNewJob: this.calculateEstimatedWaitTime(this.activeJobs.size + 1)
    };
  }

  /**
   * Get position of a specific job
   * @param {string} jobId - Job identifier
   * @returns {object|null} Job position info or null if not found
   */
  getJobPosition(jobId) {
    if (!this.activeJobs.has(jobId)) {
      return null;
    }

    let position = 0;
    for (const [id] of this.activeJobs) {
      position++;
      if (id === jobId) {
        break;
      }
    }

    const job = this.activeJobs.get(jobId);
    const elapsedTime = (Date.now() - job.startTime) / 1000;
    const remainingTime = Math.max(0, this.averageProcessingTime - elapsedTime);

    return {
      jobId,
      position,
      totalInQueue: this.activeJobs.size,
      elapsedTime: Math.round(elapsedTime),
      estimatedRemainingTime: Math.round(remainingTime),
      status: job.status
    };
  }

  /**
   * Calculate estimated wait time based on queue position
   * @param {number} position - Position in queue
   * @returns {number} Estimated wait time in seconds
   */
  calculateEstimatedWaitTime(position) {
    // Each position adds the average processing time
    // But concurrent processing can happen, so we use a factor
    const concurrencyFactor = 0.8; // Assumes some overlap
    return Math.round(position * this.averageProcessingTime * concurrencyFactor);
  }

  /**
   * Update average processing time based on completed jobs
   * @param {number} processingTime - Actual processing time in seconds
   */
  updateAverageProcessingTime(processingTime) {
    this.processingTimes.push(processingTime);

    // Keep only recent history
    if (this.processingTimes.length > this.maxHistorySize) {
      this.processingTimes.shift();
    }

    // Calculate new average
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    this.averageProcessingTime = sum / this.processingTimes.length;

    console.log(`Queue: Updated average processing time to ${Math.round(this.averageProcessingTime)}s`);
  }

  /**
   * Format wait time for display
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  static formatWaitTime(seconds) {
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }
}

module.exports = new QueueService();
