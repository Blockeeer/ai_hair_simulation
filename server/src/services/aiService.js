class AIService {
  constructor() {
    // NanoBanana API configuration
    this.nanoBananaApiKey = process.env.NANOBANANA_API_KEY;
    this.nanoBananaBaseUrl = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

    console.log('AI Service initialized');
    console.log('NanoBanana API:', this.nanoBananaApiKey && this.nanoBananaApiKey !== 'your_nanobanana_api_key_here' ? 'Configured ✓' : 'Not configured');
  }

  /**
   * Main method to change haircut using NanoBanana API
   */
  async changeHaircut(imageBase64, haircutDescription) {
    console.log('Starting haircut generation with description:', haircutDescription);

    // Check if NanoBanana API is configured
    if (!this.nanoBananaApiKey || this.nanoBananaApiKey === 'your_nanobanana_api_key_here') {
      throw new Error('NanoBanana API key not configured. Please add NANOBANANA_API_KEY to .env file');
    }

    // Use NanoBanana API
    try {
      console.log('Using NanoBanana API...');
      const result = await this.nanoBananaChangeHaircut(imageBase64, haircutDescription);
      return result;
    } catch (error) {
      console.error('NanoBanana API failed:', error.message);
      throw new Error('Failed to generate haircut simulation: ' + error.message);
    }
  }

  /**
   * NanoBanana API implementation
   */
  async nanoBananaChangeHaircut(imageBase64, haircutDescription) {
    try {
      const prompt = `Transform this person's hairstyle to: ${haircutDescription}. Keep the person's face and other features unchanged. Only modify the hair to match the description.`;

      // Save image locally and serve via deployed URL
      console.log('Saving image for public access...');
      const imageUrl = await this.saveImageLocally(imageBase64);
      console.log('Image URL:', imageUrl);

      console.log('Request payload:', {
        prompt,
        type: 'IMAGETOIAMGE',
        imageUrls: [imageUrl],
        numImages: 1
      });

      // Step 1: Create generation task
      const generateResponse = await fetch(`${this.nanoBananaBaseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.nanoBananaApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          type: 'IMAGETOIAMGE',  // API uses IMAGETOIAMGE (their typo)
          imageUrls: [imageUrl],
          numImages: 1
        })
      });

      const generateData = await generateResponse.json();

      console.log('NanoBanana API Response:', JSON.stringify(generateData, null, 2));

      if (generateData.code !== 200 || !generateData.data?.taskId) {
        throw new Error(generateData.msg || 'Failed to create generation task');
      }

      const taskId = generateData.data.taskId;
      console.log('NanoBanana task created:', taskId);

      // Step 2: Poll for task completion
      const result = await this.pollNanoBananaTask(taskId);
      return result;

    } catch (error) {
      console.error('NanoBanana API Error:', error);
      throw error;
    }
  }

  /**
   * Poll NanoBanana task status until completion
   */
  async pollNanoBananaTask(taskId, maxAttempts = 40) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.sleep(3000); // Wait 3 seconds between checks

      try {
        const statusResponse = await fetch(`${this.nanoBananaBaseUrl}/record-info?taskId=${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.nanoBananaApiKey}`,
          }
        });

        const statusData = await statusResponse.json();

        // Log full response on first attempt to see structure
        if (attempt === 0) {
          console.log('Full status response:', JSON.stringify(statusData, null, 2));
        }

        if (statusData.code !== 200) {
          throw new Error('Failed to check task status');
        }

        const status = statusData.data?.status;
        console.log(`Task ${taskId} status: ${status} (attempt ${attempt + 1}/${maxAttempts})`);

        if (status === 1) { // SUCCESS
          const imageUrls = statusData.data?.imageUrls;
          if (imageUrls && imageUrls.length > 0) {
            console.log('NanoBanana generation completed successfully');
            return imageUrls[0];
          }
          throw new Error('No image URL in response');
        } else if (status === 2 || status === 3) { // FAILED
          throw new Error('Generation failed');
        }
        // status === 0 means still generating, continue polling
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Task timeout - generation took too long');
  }

  /**
   * Upload to public hosting (Telegraph/Telegra.ph)
   */
  async uploadToPublicHost(imageBase64) {
    try {
      const FormData = require('form-data');

      // Convert base64 to buffer
      let cleanBase64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        cleanBase64 = imageBase64.split(',')[1];
      }

      const buffer = Buffer.from(cleanBase64, 'base64');

      const formData = new FormData();
      formData.append('file', buffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      });

      console.log('Uploading to telegra.ph...');
      const response = await fetch('https://telegra.ph/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('Telegraph response:', JSON.stringify(data, null, 2));

      if (data && data[0] && data[0].src) {
        const imageUrl = `https://telegra.ph${data[0].src}`;
        console.log('Image uploaded successfully to:', imageUrl);
        return imageUrl;
      } else {
        throw new Error(`Telegraph upload failed: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Telegraph upload error:', error);
      throw new Error('Failed to upload image: ' + error.message);
    }
  }

  /**
   * Save image locally and return public URL
   */
  async saveImageLocally(imageBase64) {
    try {
      const fs = require('fs');
      const path = require('path');
      const crypto = require('crypto');

      // Convert base64 to buffer
      let cleanBase64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        cleanBase64 = imageBase64.split(',')[1];
      }

      const buffer = Buffer.from(cleanBase64, 'base64');

      // Generate unique filename
      const filename = `haircut_${crypto.randomBytes(16).toString('hex')}.jpg`;
      const uploadDir = path.join(__dirname, '../../temp_uploads');
      const filePath = path.join(uploadDir, filename);

      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save file
      fs.writeFileSync(filePath, buffer);

      // Return public URL - use environment variable for base URL or localhost for development
      const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
      const publicUrl = `${baseUrl}/uploads/${filename}`;
      console.log('Image saved to:', filePath);
      console.log('Public URL:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('Error saving image locally:', error);
      throw new Error('Failed to save image: ' + error.message);
    }
  }

  /**
   * Upload image to file hosting and return URL
   */
  async uploadToCloudinary(imageBase64) {
    try {
      // Convert base64 to buffer
      let cleanBase64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        cleanBase64 = imageBase64.split(',')[1];
      }

      const buffer = Buffer.from(cleanBase64, 'base64');

      console.log('Uploading image to file.io...');

      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', buffer, {
        filename: 'haircut.jpg',
        contentType: 'image/jpeg'
      });

      const response = await fetch('https://file.io/?expires=1d', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      console.log('Upload response:', JSON.stringify(data, null, 2));

      // file.io returns JSON with success and link
      if (data.success && data.link) {
        console.log('Image uploaded successfully:', data.link);
        return data.link;
      } else {
        throw new Error(`Upload failed: ${data.message || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image: ' + error.message);
    }
  }

  /**
   * Upload image to temporary hosting and return URL (DEPRECATED - using Cloudinary now)
   */
  async uploadImageToImgbb(imageBase64) {
    try {
      // Strip data URI prefix if present
      let cleanBase64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        cleanBase64 = imageBase64.split(',')[1];
      }

      console.log('Image size (base64):', cleanBase64.length, 'bytes');

      // Use freeimage.host API
      const FormData = require('form-data');

      const formData = new FormData();
      formData.append('source', cleanBase64);
      formData.append('type', 'file');
      formData.append('action', 'upload');

      console.log('Uploading to image hosting...');
      const response = await fetch('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      console.log('Upload response status:', response.status);

      const responseText = await response.text();
      console.log('Upload raw response:', responseText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Failed to parse upload response: ${responseText.substring(0, 200)}`);
      }

      if (data.status_code === 200 && data.image?.url) {
        console.log('Image uploaded successfully to:', data.image.url);
        return data.image.url;
      } else {
        throw new Error(`Image upload failed: ${data.error?.message || JSON.stringify(data).substring(0, 200)}`);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image: ' + error.message);
    }
  }

  /**
   * Utility function to sleep/wait
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AIService();
