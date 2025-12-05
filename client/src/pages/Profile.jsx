import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';

const Profile = () => {
  const { user, updateProfile, changePassword, updateProfilePicture, removeProfilePicture } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateProfile({
        username: profileForm.username,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password validation helper (same rules as registration)
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain uppercase, lowercase, and number';
    }
    return null;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // Validate current password is not empty
    if (!passwordForm.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required' });
      setIsLoading(false);
      return;
    }

    // Validate new password with same rules as registration
    const passwordError = validatePassword(passwordForm.newPassword);
    if (passwordError) {
      setMessage({ type: 'error', text: passwordError });
      setIsLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setIsLoading(false);
      return;
    }

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePictureSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    setIsUploadingPicture(true);
    setMessage({ type: '', text: '' });

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          await updateProfilePicture(event.target.result);
          setMessage({ type: 'success', text: 'Profile picture updated!' });
        } catch (error) {
          setMessage({
            type: 'error',
            text: error.response?.data?.message || 'Failed to upload picture'
          });
        } finally {
          setIsUploadingPicture(false);
        }
      };
      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Failed to read image file' });
        setIsUploadingPicture(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to process image' });
      setIsUploadingPicture(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePicture = async () => {
    if (!user?.profileImage) return;

    setIsUploadingPicture(true);
    setMessage({ type: '', text: '' });

    try {
      await removeProfilePicture();
      setMessage({ type: 'success', text: 'Profile picture removed!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to remove picture'
      });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${isDark ? 'bg-purple-600/10' : 'bg-purple-400/20'} rounded-full blur-3xl`}></div>
        <div className={`absolute top-1/2 -left-40 w-80 h-80 ${isDark ? 'bg-pink-600/10' : 'bg-pink-400/20'} rounded-full blur-3xl`}></div>
      </div>

      {/* Toast Message */}
      {message.text && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl max-w-sm mx-4 flex items-center gap-3 border backdrop-blur-xl ${
          message.type === 'success'
            ? 'bg-green-900/80 border-green-700/50 text-green-200'
            : 'bg-red-900/80 border-red-700/50 text-red-200'
        }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            {message.type === 'success' ? (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
          </svg>
          <span className="text-sm flex-1">{message.text}</span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="hover:opacity-75 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="relative max-w-2xl mx-auto px-4 py-8">
        <h2 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
          Account <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Settings</span>
        </h2>

        {/* Tabs */}
        <div className={`flex border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} mb-6`}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Password
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Profile Picture Section */}
            <div className={`${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-xl rounded-2xl border p-6 transition-colors duration-300`}>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                Profile Picture
              </label>
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full overflow-hidden border-2 ${isDark ? 'bg-gray-800 border-purple-500/50' : 'bg-gray-100 border-purple-500/50'}`}>
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {isUploadingPicture && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  )}
                </div>

                {/* Upload/Remove Buttons */}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePictureSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPicture}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {user?.profileImage ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {user?.profileImage && (
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      disabled={isUploadingPicture}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF. Max 5MB</p>
                </div>
              </div>
            </div>

            <div className={`${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-xl rounded-2xl border p-6 space-y-5 transition-colors duration-300`}>
              {/* Username */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={profileForm.username}
                  onChange={handleProfileChange}
                  className={`w-full ${isDark ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all`}
                  placeholder="Enter username"
                />
              </div>

              {/* First Name */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  className={`w-full ${isDark ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all`}
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  className={`w-full ${isDark ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all`}
                  placeholder="Enter last name"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  disabled
                  className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'} border px-4 py-3 rounded-xl text-sm cursor-not-allowed`}
                />
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Email cannot be changed</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                isLoading
                  ? isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className={`${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-xl rounded-2xl border p-6 space-y-5 transition-colors duration-300`}>
              {/* Current Password */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className={`w-full ${isDark ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all`}
                  placeholder="Enter current password"
                  required
                />
              </div>

              {/* New Password */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full ${isDark ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all`}
                  placeholder="Enter new password"
                  required
                />
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                  Must be at least 6 characters with uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full ${isDark ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all`}
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                isLoading
                  ? isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Changing...
                </span>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        )}

        {/* Account Info */}
        <div className={`mt-8 p-6 ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-xl rounded-2xl border transition-colors duration-300`}>
          <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Account Info</h3>
          <div className={`space-y-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>Member since: <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></p>
            <p>Account ID: <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-mono`}>{user?.id?.slice(0, 8) || 'N/A'}...</span></p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
