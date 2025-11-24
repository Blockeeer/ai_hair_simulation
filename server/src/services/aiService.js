import Replicate from 'replicate';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  async changeHaircut(imageBase64, haircutDescription) {
    console.log('Starting haircut generation with Replicate...');
    console.log('Haircut description:', haircutDescription);

    // Check if Replicate API is configured
    if (!this.replicateApiToken || this.replicateApiToken === 'your_replicate_api_token_here') {
      throw new Error('Replicate API token not configured. Please add REPLICATE_API_TOKEN to .env file. Get your token at https://replicate.com/account/api-tokens');
    }

    try {
      const result = await this.replicateChangeHaircut(imageBase64, haircutDescription);
      return result;
    } catch (error) {
      console.error('Replicate API error:', error);
      throw new Error('Failed to generate haircut simulation: ' + error.message);
    }
  }

  /**
   * Replicate API implementation using flux-kontext-apps/change-haircut
   */
  async replicateChangeHaircut(imageBase64, haircutDescription) {
    try {
      // Ensure base64 has data URI prefix
      let base64DataUri = imageBase64;
      if (!imageBase64.startsWith('data:')) {
        base64DataUri = `data:image/jpeg;base64,${imageBase64}`;
      }

      console.log('Preparing Replicate input...');

      // Map haircut description to Replicate's expected format
      // The API expects specific haircut types or "Random"
      const input = {
        haircut: haircutDescription,
        hair_color: "Random",
        input_image: base64DataUri
      };

      console.log('Running Replicate model: flux-kontext-apps/change-haircut');
      console.log('Input:', {
        haircut: input.haircut,
        hair_color: input.hair_color,
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

      const outputPath = join(__dirname, '../../uploads', filename);
      await writeFile(outputPath, buffer);

      console.log('✓ Result saved to:', outputPath);
      return outputPath;
    } catch (error) {
      console.error('Failed to download result:', error);
      throw error;
    }
  }
}

export default new AIService();
