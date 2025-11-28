const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload an image to Cloudinary
 * @param {string} imageData - Base64 data URI or URL
 * @param {string} userId - User ID for organizing storage
 * @param {string} type - 'original' or 'result'
 * @returns {Promise<string>} - Public URL of the uploaded image
 */
const uploadImage = async (imageData, userId, type = 'result') => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file');
    }

    const uniqueId = crypto.randomUUID();
    const publicId = `simulations/${userId}/${type}_${uniqueId}`;

    let uploadData;

    // Handle base64 data URI - can be uploaded directly
    if (imageData.startsWith('data:')) {
      uploadData = imageData;
    }
    // Handle URL - Cloudinary can fetch from URLs directly
    else if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      uploadData = imageData;
    }
    // Handle raw base64 (no data URI prefix) - add prefix
    else {
      uploadData = `data:image/png;base64,${imageData}`;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(uploadData, {
      public_id: publicId,
      folder: '', // folder is included in public_id
      resource_type: 'image',
      overwrite: true
    });

    console.log(`✓ Image uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;

  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} imageUrl - Public URL of the image
 */
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return; // Not a Cloudinary URL, skip
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length < 2) {
      return;
    }

    // Get the part after /upload/ and remove version and extension
    let publicId = urlParts[1];
    // Remove version (v123456789/)
    publicId = publicId.replace(/^v\d+\//, '');
    // Remove file extension
    publicId = publicId.replace(/\.[^.]+$/, '');

    await cloudinary.uploader.destroy(publicId);
    console.log(`✓ Image deleted from Cloudinary: ${publicId}`);

  } catch (error) {
    // Don't throw on delete errors, just log
    console.error('Error deleting from Cloudinary:', error.message);
  }
};

module.exports = {
  uploadImage,
  deleteImage
};
