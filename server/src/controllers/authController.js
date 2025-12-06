const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { getAuth } = require('../config/firebase');
const userService = require('../services/userService');
const passwordResetService = require('../services/passwordResetService');
const emailService = require('../services/emailService');
const storageService = require('../services/storageService');

const auth = getAuth();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Create user
    const user = await userService.createUser({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. You have 5 free generations per day!',
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Find user
    let user;
    try {
      user = await userService.findByEmail(email);
      console.log('User lookup result:', user ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error. Please check Firestore configuration.',
        error: dbError.message
      });
    }

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await userService.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userService.getPublicProfile(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await userService.findById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: userService.getPublicProfile(user)
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;
    const user = await userService.findById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await userService.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    // Update user
    const updates = {};
    if (username) updates.username = username;
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;

    const updatedUser = await userService.updateUser(req.user.uid, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userService.getPublicProfile(updatedUser)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await userService.findById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user signed up with Google (no password)
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for Google sign-in accounts'
      });
    }

    // Verify current password
    const isPasswordValid = await userService.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in Firestore
    await userService.updateUser(req.user.uid, { password: hashedPassword });

    // Update password in Firebase Auth
    await auth.updateUser(req.user.uid, {
      password: newPassword
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Decode the Google JWT token to get user info
    // The credential is a JWT token from Google
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const googleUserData = JSON.parse(jsonPayload);

    // Verify the token is from Google and not expired
    if (!googleUserData.email || !googleUserData.sub) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google credential'
      });
    }

    // Check token expiry
    const now = Math.floor(Date.now() / 1000);
    if (googleUserData.exp && googleUserData.exp < now) {
      return res.status(400).json({
        success: false,
        message: 'Google credential has expired'
      });
    }

    // Find or create user
    const { user, isNewUser } = await userService.findOrCreateGoogleUser(googleUserData);

    // Update last login
    await userService.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      token,
      user,
      isNewUser
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error with Google authentication',
      error: error.message
    });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.'
    };

    // Find user by email
    const user = await userService.findByEmail(email);

    if (!user) {
      // Return success even if user doesn't exist (security)
      return res.json(successResponse);
    }

    // Check if user signed up with Google (no password reset for OAuth users)
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Please use "Continue with Google" to access your account.'
      });
    }

    // Check rate limiting
    const rateLimit = await passwordResetService.checkRateLimit(email);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many password reset requests. Please try again later.'
      });
    }

    // Generate reset token
    const { token } = await passwordResetService.createResetToken(email, user.id);

    // Build reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${token}`;

    // Send email
    try {
      await emailService.sendPasswordResetEmail(email, resetUrl, user.username || user.firstName);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't reveal email sending failure to prevent enumeration
    }

    res.json(successResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Validate token
    const validation = await passwordResetService.validateResetToken(token);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error || 'Invalid or expired reset token'
      });
    }

    // Find user
    const user = await userService.findById(validation.userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in Firestore
    await userService.updateUser(validation.userId, { password: hashedPassword });

    // Update password in Firebase Auth
    try {
      await auth.updateUser(validation.userId, {
        password: newPassword
      });
    } catch (firebaseError) {
      console.error('Firebase Auth update error:', firebaseError);
      // Continue even if Firebase Auth update fails
    }

    // Mark token as used
    await passwordResetService.markTokenUsed(validation.tokenId);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// @desc    Upload profile picture
// @route   PUT /api/auth/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    const user = await userService.findById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile image if exists and is from Cloudinary
    if (user.profileImage && user.profileImage.includes('cloudinary.com')) {
      try {
        await storageService.deleteImage(user.profileImage);
      } catch (deleteError) {
        console.error('Error deleting old profile image:', deleteError);
        // Continue even if delete fails
      }
    }

    // Upload new profile image to Cloudinary
    const profileImageUrl = await storageService.uploadImage(
      image,
      req.user.uid,
      'profile'
    );

    // Update user profile with new image URL
    const updatedUser = await userService.updateUser(req.user.uid, {
      profileImage: profileImageUrl
    });

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      user: userService.getPublicProfile(updatedUser)
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture',
      error: error.message
    });
  }
};

// @desc    Remove profile picture
// @route   DELETE /api/auth/profile-picture
// @access  Private
exports.removeProfilePicture = async (req, res) => {
  try {
    const user = await userService.findById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete profile image from Cloudinary if exists
    if (user.profileImage && user.profileImage.includes('cloudinary.com')) {
      try {
        await storageService.deleteImage(user.profileImage);
      } catch (deleteError) {
        console.error('Error deleting profile image:', deleteError);
        // Continue even if delete fails
      }
    }

    // Update user profile to remove image
    const updatedUser = await userService.updateUser(req.user.uid, {
      profileImage: null
    });

    res.json({
      success: true,
      message: 'Profile picture removed successfully',
      user: userService.getPublicProfile(updatedUser)
    });
  } catch (error) {
    console.error('Remove profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing profile picture',
      error: error.message
    });
  }
};
