import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const { register, googleAuth } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      onClose();
      navigate('/dashboard');
    } catch (error) {
      const backendErrors = error.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        const newErrors = {};
        backendErrors.forEach(err => {
          if (err.path) {
            newErrors[err.path] = err.msg;
          }
        });
        setErrors({
          ...newErrors,
          general: error.response?.data?.message || 'Registration failed. Please check your information.'
        });
      } else {
        setErrors({
          general: error.response?.data?.message || 'Registration failed. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setErrors({});

    try {
      await googleAuth(credentialResponse.credential);
      onClose();
      navigate('/dashboard');
    } catch (error) {
      setErrors({
        general: error.response?.data?.message || 'Google sign-up failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrors({
      general: 'Google sign-up failed. Please try again.'
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when modal is open and prevent layout shift
  useEffect(() => {
    if (isOpen) {
      // Get scrollbar width before hiding it
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
      style={{ isolation: 'isolate' }}
    >
      <div className="relative w-full max-w-[340px] sm:max-w-md md:max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl animate-fadeIn overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/90 z-20 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-white font-medium text-sm md:text-base">Creating your account...</p>
            <p className="text-gray-400 text-xs md:text-sm mt-1">Please wait</p>
          </div>
        )}
        <div className="flex flex-col md:flex-row">
          {/* Left Side - Project Info (Hidden on mobile) */}
          <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-gray-800 to-gray-900 p-8 flex-col justify-between">
            {/* Logo */}
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI Hair Simulation</span>
                  <span className="text-xs block text-gray-400">Transform Your Look</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">Join Us Today</h2>
              <p className="text-gray-400 mb-6">Create an account to unlock all features and start your hair transformation journey.</p>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">5 Free Generations Daily</p>
                    <p className="text-gray-500 text-xs">Try multiple hairstyles each day</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Save Your History</p>
                    <p className="text-gray-500 text-xs">Access all your past simulations</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Advanced AI Models</p>
                    <p className="text-gray-500 text-xs">Choose between Replicate & Gemini</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Secure & Private</p>
                    <p className="text-gray-500 text-xs">Your data is always protected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom text */}
            <p className="text-gray-600 text-xs mt-8">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          {/* Right Side - Form */}
          <div className="flex-1 p-4 sm:p-6 md:p-8">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 md:w-auto md:h-auto bg-gray-800 md:bg-transparent rounded-full md:rounded-none flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 md:hover:bg-transparent transition-colors z-10"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Mobile Logo */}
            <div className="flex items-center space-x-2 mb-3 md:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI Hair Simulation</span>
            </div>

            {/* Header */}
            <div className="mb-3 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Create Account</h2>
              <p className="text-gray-400 text-xs md:text-sm">Fill in your details to get started</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5 md:space-y-4">
              {/* General Error */}
              {errors.general && (
                <div className="bg-red-900/30 border border-red-800 text-red-300 px-3 py-2 md:px-4 md:py-3 rounded-lg relative">
                  <span className="block text-xs md:text-sm">{errors.general}</span>
                  <button
                    type="button"
                    onClick={() => setErrors(prev => ({ ...prev, general: '' }))}
                    className="absolute top-0 bottom-0 right-0 px-3 py-2 text-red-400 hover:text-red-300"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Username & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose username"
                    className={`w-full bg-gray-800 border ${errors.username ? 'border-red-500' : 'border-gray-700'} text-white text-sm px-3 py-2 md:px-4 md:py-2.5 rounded-lg focus:outline-none focus:border-gray-500 placeholder-gray-500`}
                  />
                  {errors.username && (
                    <p className="mt-1 text-xs text-red-400">{errors.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className={`w-full bg-gray-800 border ${errors.email ? 'border-red-500' : 'border-gray-700'} text-white text-sm px-3 py-2 md:px-4 md:py-2.5 rounded-lg focus:outline-none focus:border-gray-500 placeholder-gray-500`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 md:px-4 md:py-2.5 rounded-lg focus:outline-none focus:border-gray-500 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 md:px-4 md:py-2.5 rounded-lg focus:outline-none focus:border-gray-500 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create password"
                      className={`w-full bg-gray-800 border ${errors.password ? 'border-red-500' : 'border-gray-700'} text-white text-sm px-3 py-2 md:px-4 md:py-2.5 rounded-lg focus:outline-none focus:border-gray-500 placeholder-gray-500 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">
                    Confirm
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      className={`w-full bg-gray-800 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-700'} text-white text-sm px-3 py-2 md:px-4 md:py-2.5 rounded-lg focus:outline-none focus:border-gray-500 placeholder-gray-500 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Password hint */}
              <p className="text-[10px] md:text-xs text-gray-500">
                Password: 6+ chars with uppercase, lowercase, and number
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 md:py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  isLoading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-purple-500/25'
                }`}
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs md:text-sm">
                  <span className="px-4 bg-gray-900 text-gray-400">or</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="medium"
                  width="100%"
                  text="signup_with"
                  shape="rectangular"
                />
              </div>

              {/* Login Link */}
              <p className="text-center text-xs md:text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-white hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default RegisterModal;
