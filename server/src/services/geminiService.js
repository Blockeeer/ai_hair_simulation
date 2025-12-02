const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;

    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      console.warn('⚠️  Gemini API key not configured');
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      console.log('✓ Gemini AI Service initialized successfully');
    }
  }

  /**
   * Generate hairstyle change using Gemini's image generation
   */
  async changeHaircut(imageBase64, options = {}) {
    const { haircut = 'natural waves', hair_color = 'natural' } = options;

    console.log('Starting haircut generation with Gemini...');
    console.log('Options:', { haircut, hair_color });

    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to .env file.');
    }

    try {
      // Use Gemini 2.5 Flash Image for image generation
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash-image",
        generationConfig: {
          responseModalities: ["Text", "Image"]
        }
      });

      // Build the prompt
      const colorPrompt = hair_color && hair_color !== 'natural' && hair_color !== 'No change'
        ? ` with ${hair_color} hair color`
        : '';

      const prompt = `Keep the uploaded person's exact face, body pose, outfit and background, but change the hairstyle to a ${haircut}${colorPrompt}. Make the new hair look natural, realistic, and consistent with lighting and head shape. Maintain photo-realistic skin texture and full likeness of the original image.`;

      console.log('Gemini prompt:', prompt);

      // Extract base64 data (remove data URI prefix if present)
      let base64Data = imageBase64;
      let mimeType = 'image/jpeg';

      if (imageBase64.startsWith('data:')) {
        const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      // Create the image part
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      // Generate content with image
      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response;

      console.log('Gemini response received');
      console.log('Response structure:', JSON.stringify(response, null, 2).substring(0, 500));

      // Extract the generated image from the response
      if (response.candidates && response.candidates[0]) {
        const parts = response.candidates[0].content?.parts || [];
        console.log('Number of parts:', parts.length);

        for (const part of parts) {
          console.log('Part keys:', Object.keys(part));

          if (part.inlineData) {
            // Return as data URI
            const generatedImageBase64 = part.inlineData.data;
            const generatedMimeType = part.inlineData.mimeType || 'image/png';
            const dataUri = `data:${generatedMimeType};base64,${generatedImageBase64}`;

            console.log('✓ Gemini haircut simulation completed successfully');
            return dataUri;
          }

          // Check for fileData (alternative response format)
          if (part.fileData) {
            console.log('Found fileData:', part.fileData);
            // Handle fileData format if needed
          }
        }
      }

      // Log full response if no image found
      console.log('Full response:', JSON.stringify(response, null, 2));
      throw new Error('No image generated in Gemini response');

    } catch (error) {
      console.error('Gemini API error:', error);

      if (error.message?.includes('API key')) {
        throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in .env file');
      } else if (error.message?.includes('quota')) {
        throw new Error('Gemini API quota exceeded. Please try again later');
      } else if (error.message?.includes('safety')) {
        throw new Error('Image was blocked by safety filters. Please try a different image.');
      }

      throw new Error('Failed to generate with Gemini: ' + error.message);
    }
  }
}

module.exports = new GeminiService();
