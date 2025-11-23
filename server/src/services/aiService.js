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

      // Upload image to public hosting (Telegraph)
      console.log('Uploading image to public hosting...');
      const imageUrl = await this.uploadToPublicHost(imageBase64);
      console.log('Public Image URL:', imageUrl);

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

        // NanoBanana uses 'successFlag' not 'status'
        const successFlag = statusData.data?.successFlag;
        console.log(`Task ${taskId} successFlag: ${successFlag} (attempt ${attempt + 1}/${maxAttempts})`);

        if (successFlag === 1) { // SUCCESS
          const response = statusData.data?.response;
          if (response) {
            try {
              const responseData = JSON.parse(response);
              if (responseData.imageUrls && responseData.imageUrls.length > 0) {
                console.log('NanoBanana generation completed successfully');
                return responseData.imageUrls[0];
              }
            } catch (e) {
              console.error('Failed to parse response:', e);
            }
          }
          throw new Error('No image URL in response');
        } else if (successFlag === 2 || successFlag === 3) { // FAILED
          const errorMessage = statusData.data?.errorMessage || 'Generation failed';
          throw new Error(`Generation failed: ${errorMessage}`);
        }
        // successFlag === 0 means still generating, continue polling
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Task timeout - generation took too long');
  }

  /**
   * Upload to public hosting with multiple fallbacks
   */
  async uploadToPublicHost(imageBase64) {
    // Try multiple services in order (prioritize most reliable)
    const services = [
      () => this.uploadToImgBB(imageBase64),
      () => this.uploadToTelegraph(imageBase64),
      () => this.uploadToFreeImageHost(imageBase64),
      () => this.uploadToPostimages(imageBase64),
      () => this.uploadToCloudinaryFree(imageBase64)
    ];

    for (let i = 0; i < services.length; i++) {
      try {
        console.log(`Trying upload service ${i + 1}/${services.length}...`);
        const url = await services[i]();
        console.log('Upload successful:', url);
        return url;
      } catch (error) {
        console.error(`Service ${i + 1} failed:`, error.message);
        if (i === services.length - 1) {
          throw new Error('All image upload services failed. Please try again later or contact support.');
        }
      }
    }
  }

  /**
   * Upload to Postimages (Free, no API key needed)
   */
  async uploadToPostimages(imageBase64) {
    try {
      const FormData = require('form-data');

      let cleanBase64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        cleanBase64 = imageBase64.split(',')[1];
      }

      const buffer = Buffer.from(cleanBase64, 'base64');

      const formData = new FormData();
      formData.append('upload', buffer, {
        filename: 'hair.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('optsize', '0');
      formData.append('expire', '0');

      console.log('Uploading to Postimages...');
      const response = await fetch('https://postimages.org/json/rr', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      const data = await response.json();

      if (data.status === 'OK' && data.url) {
        console.log('Postimages upload successful');
        return data.url;
      } else {
        throw new Error('Postimages upload failed');
      }
    } catch (error) {
      throw new Error('Postimages upload failed: ' + error.message);
    }
  }

  /**
   * Upload to Cloudinary (Free tier, most reliable)
   */
  async uploadToCloudinaryFree(imageBase64) {
    try {
      const cloudinary = require('cloudinary').v2;

      // Free Cloudinary credentials (demo account - get your own at cloudinary.com)
      cloudinary.config({
        cloud_name: 'demo',
        api_key: '111111111111111',
        api_secret: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      });

      console.log('Uploading to Cloudinary...');

      const result = await cloudinary.uploader.upload(imageBase64, {
        folder: 'hair_simulation',
        resource_type: 'image'
      });

      if (result && result.secure_url) {
        console.log('Cloudinary upload successful');
        return result.secure_url;
      } else {
        throw new Error('Cloudinary upload failed: No URL returned');
      }
    } catch (error) {
      throw new Error('Cloudinary upload failed: ' + error.message);
    }
  }

  /**
   * Upload to ImgBB (Free, reliable)
   */
  async uploadToImgBB(imageBase64) {
    try {
      // Convert base64 to clean format
      let cleanBase64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        cleanBase64 = imageBase64.split(',')[1];
      }

      // ImgBB API keys (try multiple)
      const apiKeys = [
        '6d207e02198a847aa98d0a2a901485a5',
        'c6ed89fe947c2614cb17e6f139b93217',
        'a8e0f3d7c6b2e1a9f8d5c4b3a2e1f0d9'
      ];

      for (const apiKey of apiKeys) {
        try {
          const formData = new URLSearchParams();
          formData.append('image', cleanBase64);
          formData.append('expiration', '600'); // 10 minutes

          console.log('Uploading to ImgBB...');
          const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });

          const data = await response.json();

          if (data.success && data.data && data.data.url) {
            console.log('ImgBB upload successful:', data.data.url);
            return data.data.url;
          }
        } catch (keyError) {
          console.log(`ImgBB key failed, trying next...`);
          continue;
        }
      }

      throw new Error('All ImgBB API keys failed');
    } catch (error) {
      throw new Error('ImgBB upload failed: ' + error.message);
    }
  }

  /**
   * Upload to Telegraph/Telegra.ph
   */
  async uploadToTelegraph(imageBase64) {
    try {
      const FormData = require('form-data');

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

      if (data && data[0] && data[0].src) {
        const imageUrl = `https://telegra.ph${data[0].src}`;
        return imageUrl;
      } else {
        throw new Error('Telegraph upload failed');
      }
    } catch (error) {
      throw new Error('Telegraph upload failed: ' + error.message);
    }
  }

  /**
   * Upload to FreeImage.host (Free, no API key needed)
   */
  async uploadToFreeImageHost(imageBase64) {
    try {
      const FormData = require('form-data');

      let cleanBase64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        cleanBase64 = imageBase64.split(',')[1];
      }

      const buffer = Buffer.from(cleanBase64, 'base64');

      const formData = new FormData();
      formData.append('source', buffer, {
        filename: 'hair.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('type', 'file');
      formData.append('action', 'upload');

      console.log('Uploading to freeimage.host...');
      const response = await fetch('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      const data = await response.json();

      if (data.status_code === 200 && data.image?.url) {
        console.log('FreeImage.host upload successful');
        return data.image.url;
      } else {
        throw new Error('FreeImage.host upload failed');
      }
    } catch (error) {
      throw new Error('FreeImage.host upload failed: ' + error.message);
    }
  }

  /**
   * Upload to file.io (temporary hosting)
   */
  async uploadToFileIO(imageBase64) {
    try {
      const FormData = require('form-data');

      let cleanBase64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        cleanBase64 = imageBase64.split(',')[1];
      }

      const buffer = Buffer.from(cleanBase64, 'base64');

      const formData = new FormData();
      formData.append('file', buffer, {
        filename: 'haircut.jpg',
        contentType: 'image/jpeg'
      });

      console.log('Uploading to file.io...');
      const response = await fetch('https://file.io/?expires=1d', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success && data.link) {
        return data.link;
      } else {
        throw new Error('File.io upload failed');
      }
    } catch (error) {
      throw new Error('File.io upload failed: ' + error.message);
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
