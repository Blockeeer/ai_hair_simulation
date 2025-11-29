import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Landing = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Trial count from localStorage
  const getTrialCount = () => {
    return parseInt(localStorage.getItem('trialGenerations') || '0');
  };

  const incrementTrialCount = () => {
    const count = getTrialCount() + 1;
    localStorage.setItem('trialGenerations', count.toString());
    return count;
  };

  const remainingTrials = 2 - getTrialCount();

  const hairStyles = [
    { id: 'buzz-cut', name: 'Buzz Cut', description: 'Short and clean' },
    { id: 'fade', name: 'Fade', description: 'Gradient style' },
    { id: 'pompadour', name: 'Pompadour', description: 'Classic volume' },
    { id: 'curly', name: 'Curly', description: 'Natural curls' },
    { id: 'long-straight', name: 'Long Straight', description: 'Sleek and long' },
    { id: 'bob', name: 'Bob Cut', description: 'Modern bob' },
  ];

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
      setGeneratedImage(null);
    }
  };

  const handleGenerate = async () => {
    if (remainingTrials <= 0) {
      setError('You have used all your free trials. Please sign up to continue!');
      return;
    }

    if (!selectedImage || !selectedStyle) {
      setError('Please select an image and a hairstyle');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('style', selectedStyle);
      formData.append('isTrial', 'true');

      const response = await axios.post(`${API_URL}/simulation/trial-generate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setGeneratedImage(response.data.data.generatedImageUrl);
        incrementTrialCount();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Modal handlers
  const openLoginModal = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const openRegisterModal = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleForgotPassword = () => {
    setShowLoginModal(false);
    navigate('/forgot-password');
  };

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Powered',
      description: 'Advanced AI technology to simulate realistic hairstyles'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Instant Results',
      description: 'Get your new look in seconds, not hours'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Multiple Styles',
      description: 'Choose from a variety of trending hairstyles'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xl font-bold">AI Hair Simulation</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={openLoginModal}
                className="text-gray-300 hover:text-white transition-colors px-4 py-2"
              >
                Sign In
              </button>
              <button
                onClick={openRegisterModal}
                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
            Transform Your Look
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
            See yourself with any hairstyle before you commit. Our AI-powered simulator lets you try different looks instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#try-now"
              className="bg-white text-black px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-200 transition-colors"
            >
              Try It Free
            </a>
            <button
              onClick={openRegisterModal}
              className="border border-gray-700 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-900 transition-colors"
            >
              Create Account
            </button>
          </div>
          <p className="mt-4 text-gray-500 text-sm">
            {remainingTrials > 0
              ? `${remainingTrials} free trial${remainingTrials > 1 ? 's' : ''} remaining - no signup required`
              : 'Sign up for more generations!'
            }
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:border-gray-700 transition-colors"
              >
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Try Now Section */}
      <section id="try-now" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Try It Now</h2>
          <p className="text-gray-400 text-center mb-8">
            Upload your photo and select a hairstyle to see the magic
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6 text-center">
              {error}
              {remainingTrials <= 0 && (
                <button
                  onClick={openRegisterModal}
                  className="ml-2 underline hover:text-red-200"
                >
                  Sign up now
                </button>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">1. Upload Your Photo</h3>
              <div
                onClick={() => remainingTrials > 0 && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-700 rounded-xl p-8 text-center ${
                  remainingTrials > 0 ? 'cursor-pointer hover:border-gray-600' : 'opacity-50 cursor-not-allowed'
                } transition-colors`}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400">Click to upload your photo</p>
                    <p className="text-gray-600 text-sm mt-1">JPG, PNG up to 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={remainingTrials <= 0}
              />

              <h3 className="text-lg font-semibold mt-6 mb-4">2. Select a Hairstyle</h3>
              <div className="grid grid-cols-2 gap-3">
                {hairStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => remainingTrials > 0 && setSelectedStyle(style.id)}
                    disabled={remainingTrials <= 0}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedStyle === style.id
                        ? 'border-white bg-white/10'
                        : 'border-gray-700 hover:border-gray-600'
                    } ${remainingTrials <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className="font-medium text-sm">{style.name}</p>
                    <p className="text-gray-500 text-xs">{style.description}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedImage || !selectedStyle || remainingTrials <= 0}
                className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors ${
                  isGenerating || !selectedImage || !selectedStyle || remainingTrials <= 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate Hairstyle'}
              </button>
            </div>

            {/* Result Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Result</h3>
              <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
                {isGenerating ? (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Generating your new look...</p>
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="max-h-80 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <p>Your generated hairstyle will appear here</p>
                  </div>
                )}
              </div>

              {generatedImage && (
                <div className="mt-4 text-center">
                  <p className="text-gray-400 text-sm mb-4">
                    Like what you see? Sign up for unlimited generations!
                  </p>
                  <button
                    onClick={openRegisterModal}
                    className="inline-block bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Create Free Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of users who have discovered their perfect hairstyle
          </p>
          <button
            onClick={openRegisterModal}
            className="inline-block bg-white text-black px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-200 transition-colors"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>&copy; 2024 AI Hair Simulation. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={openRegisterModal}
        onForgotPassword={handleForgotPassword}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={openLoginModal}
      />
    </div>
  );
};

export default Landing;
