const Replicate = require('replicate');
const fs = require('fs').promises;
const path = require('path');

class AIService {
  constructor() {
    // Replicate API configuration
    this.replicateApiToken = process.env.REPLICATE_API_TOKEN;

    if (!this.replicateApiToken || this.replicateApiToken === 'your_replicate_api_token_here') {
      console.warn('⚠️  Replicate API token not configured');
    } else {
      this.replicate = new Replicate({
        auth: this.replicateApiToken,
      });
      console.log('✓ Replicate AI Service initialized successfully');
    }
  }

  /**
   * Main method to change haircut using Replicate API
   */
  async changeHaircut(imageBase64, options = {}) {
    const { haircut = 'Random', hair_color = 'Random', gender = 'none' } = options;

    console.log('Starting haircut generation with Replicate...');
    console.log('Options:', { haircut, hair_color, gender });

    // Check if Replicate API is configured
    if (!this.replicateApiToken || this.replicateApiToken === 'your_replicate_api_token_here') {
      throw new Error('Replicate API token not configured. Please add REPLICATE_API_TOKEN to .env file. Get your token at https://replicate.com/account/api-tokens');
    }

    try {
      const result = await this.replicateChangeHaircut(imageBase64, { haircut, hair_color, gender });
      return result;
    } catch (error) {
      console.error('Replicate API error:', error);
      throw new Error('Failed to generate haircut simulation: ' + error.message);
    }
  }

  /**
   * Replicate API implementation using flux-kontext-apps/change-haircut
   */
  async replicateChangeHaircut(imageBase64, options) {
    try {
      // Ensure base64 has data URI prefix
      let base64DataUri = imageBase64;
      if (!imageBase64.startsWith('data:')) {
        base64DataUri = `data:image/jpeg;base64,${imageBase64}`;
      }

      console.log('Preparing Replicate input...');

      // Prepare input for Replicate API
      const input = {
        haircut: options.haircut,
        hair_color: options.hair_color,
        gender: options.gender,
        input_image: base64DataUri
      };

      console.log('Running Replicate model: flux-kontext-apps/change-haircut');
      console.log('Input:', {
        haircut: input.haircut,
        hair_color: input.hair_color,
        gender: input.gender,
        input_image: 'base64 image data'
      });

      // Run the model
      const output = await this.replicate.run(
        "flux-kontext-apps/change-haircut",
        { input }
      );

      console.log('Replicate output received:', output);

      // The output is a file object with a url() method
      if (output && typeof output.url === 'function') {
        const imageUrl = output.url();
        console.log('✓ Haircut simulation completed successfully');
        console.log('Result URL:', imageUrl);
        return imageUrl;
      } else if (typeof output === 'string') {
        // Sometimes the output is directly a URL string
        console.log('✓ Haircut simulation completed successfully');
        console.log('Result URL:', output);
        return output;
      } else {
        console.error('Unexpected output format:', output);
        throw new Error('Unexpected output format from Replicate API');
      }

    } catch (error) {
      console.error('Replicate API error details:', error);

      // Provide more helpful error messages
      if (error.message?.includes('authentication')) {
        throw new Error('Invalid Replicate API token. Please check your REPLICATE_API_TOKEN in .env file');
      } else if (error.message?.includes('rate limit')) {
        throw new Error('Replicate API rate limit reached. Please try again later');
      } else if (error.message?.includes('model')) {
        throw new Error('Replicate model error. The change-haircut model may be temporarily unavailable');
      }

      throw error;
    }
  }

  /**
   * Helper method to download and save the result image (optional)
   */
  async downloadResult(imageUrl, filename = 'result.png') {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const outputPath = path.join(__dirname, '../../uploads', filename);
      await fs.writeFile(outputPath, buffer);

      console.log('✓ Result saved to:', outputPath);
      return outputPath;
    } catch (error) {
      console.error('Failed to download result:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
