import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

// Import before/after images
import imgBefore from '../assets/img_before.jpg';
import imgAfter from '../assets/img_after.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Landing = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedModel, setSelectedModel] = useState('replicate');
  const [selectedGender, setSelectedGender] = useState('male');
  const [selectedHairColor, setSelectedHairColor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Theme state
  const [isDark, setIsDark] = useState(true);

  // Before/After slider state
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef(null);

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

  // AI Model options
  const modelOptions = [
    { value: 'replicate', label: 'Replicate', description: 'Fast and reliable' },
    { value: 'gemini', label: 'Google Gemini', description: 'Advanced AI' }
  ];

  // Replicate hairstyles - exact options from flux-kontext-apps/change-haircut API
  const replicateStyles = {
    male: [
      { id: 'crew-cut', name: 'Crew Cut', description: 'Short and clean' },
      { id: 'undercut', name: 'Undercut', description: 'Modern edge' },
      { id: 'mohawk', name: 'Mohawk', description: 'Bold statement' },
      { id: 'faux-hawk', name: 'Faux Hawk', description: 'Subtle mohawk' },
      { id: 'slicked-back', name: 'Slicked Back', description: 'Smooth and sleek' },
      { id: 'curly', name: 'Curly', description: 'Natural curls' },
    ],
    female: [
      { id: 'bob', name: 'Bob', description: 'Classic bob' },
      { id: 'pixie-cut', name: 'Pixie Cut', description: 'Short and chic' },
      { id: 'wavy', name: 'Wavy', description: 'Soft waves' },
      { id: 'curly', name: 'Curly', description: 'Natural curls' },
      { id: 'layered', name: 'Layered', description: 'Textured layers' },
      { id: 'lob', name: 'Lob', description: 'Long bob' },
    ]
  };

  // Gemini hairstyles - categorized by gender
  const geminiStyles = {
    male: [
      { id: 'buzz-cut', name: 'Buzz Cut', description: 'Short and clean' },
      { id: 'fade', name: 'Fade Haircut', description: 'Gradient style' },
      { id: 'high-fade', name: 'High Fade', description: 'Bold gradient' },
      { id: 'low-fade', name: 'Low Fade', description: 'Subtle gradient' },
      { id: 'pompadour', name: 'Pompadour', description: 'Classic volume' },
      { id: 'undercut', name: 'Undercut', description: 'Modern and edgy' },
      { id: 'quiff', name: 'Quiff', description: 'Textured top' },
      { id: 'crew-cut', name: 'Crew Cut', description: 'Military style' },
      { id: 'french-crop', name: 'French Crop', description: 'Short textured' },
      { id: 'caesar-cut', name: 'Caesar Cut', description: 'Classic Roman' },
      { id: 'man-bun', name: 'Man Bun', description: 'Long tied back' },
      { id: 'mullet', name: 'Mullet', description: 'Business in front' },
      { id: 'spiky-hair', name: 'Spiky Hair', description: 'Edgy spikes' },
      { id: 'slick-back', name: 'Slick Back', description: 'Smooth and sleek' },
      { id: 'textured-fringe', name: 'Textured Fringe', description: 'Messy bangs' },
      { id: 'curtain-hair', name: 'Curtain Hair', description: 'Middle parted' },
    ],
    female: [
      { id: 'natural-waves', name: 'Natural Waves', description: 'Soft and flowing' },
      { id: 'bob-cut', name: 'Bob Cut', description: 'Modern bob' },
      { id: 'pixie-cut', name: 'Pixie Cut', description: 'Short and chic' },
      { id: 'long-layered', name: 'Long Layered', description: 'Flowing layers' },
      { id: 'lob', name: 'Lob (Long Bob)', description: 'Trendy length' },
      { id: 'curtain-bangs', name: 'Curtain Bangs', description: 'Face framing' },
      { id: 'beach-waves', name: 'Beach Waves', description: 'Effortless waves' },
      { id: 'straight-sleek', name: 'Straight & Sleek', description: 'Smooth and shiny' },
      { id: 'braided-hair', name: 'Braided Hair', description: 'Elegant braids' },
      { id: 'ponytail', name: 'Ponytail', description: 'Classic tied back' },
      { id: 'messy-bun', name: 'Messy Bun', description: 'Casual updo' },
      { id: 'half-up-half-down', name: 'Half Up Half Down', description: 'Versatile style' },
      { id: 'bangs', name: 'Bangs', description: 'Classic fringe' },
      { id: 'shag', name: 'Shag', description: 'Retro layers' },
      { id: 'curly', name: 'Curly', description: 'Bouncy curls' },
      { id: 'blunt-cut', name: 'Blunt Cut', description: 'Sharp edges' },
    ]
  };

  // Replicate hair colors - exact options from flux-kontext-apps/change-haircut API
  const replicateHairColors = [
    { id: 'no-change', name: 'No Change', description: 'Keep original' },
    { id: 'random', name: 'Random', description: 'Surprise me' },
    { id: 'blonde', name: 'Blonde', description: 'Light blonde' },
    { id: 'brunette', name: 'Brunette', description: 'Rich brown' },
    { id: 'black', name: 'Black', description: 'Deep black' },
    { id: 'red', name: 'Red', description: 'Vibrant red' },
    { id: 'platinum-blonde', name: 'Platinum', description: 'Icy blonde' },
    { id: 'auburn', name: 'Auburn', description: 'Red-brown' },
  ];

  // Gemini hair colors
  const geminiHairColors = [
    { id: 'natural', name: 'Natural', description: 'Keep original' },
    { id: 'blonde', name: 'Blonde', description: 'Light and bright' },
    { id: 'brunette', name: 'Brunette', description: 'Rich brown' },
    { id: 'black', name: 'Black', description: 'Deep and dark' },
    { id: 'red', name: 'Red', description: 'Vibrant red' },
    { id: 'platinum-blonde', name: 'Platinum', description: 'Icy blonde' },
  ];

  // Get current hairstyles and hair colors based on selected model
  const currentStyles = selectedModel === 'gemini' ? geminiStyles : replicateStyles;
  const hairStyles = currentStyles[selectedGender] || [];
  const hairColors = selectedModel === 'gemini' ? geminiHairColors : replicateHairColors;

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
      formData.append('model', selectedModel);
      formData.append('isTrial', 'true');

      // Send hair color for both models (default to 'random' for Replicate if not selected)
      if (selectedHairColor) {
        formData.append('hairColor', selectedHairColor);
      } else if (selectedModel === 'replicate') {
        formData.append('hairColor', 'random');
      }

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

  // Slider handlers for before/after comparison
  const handleSliderMove = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleSliderMouseDown = () => {
    const handleMouseMove = (e) => handleSliderMove(e);
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSliderTouchMove = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
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
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Powered',
      description: 'Advanced AI for realistic results'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Instant Results',
      description: 'Get your new look in seconds'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Multiple Styles',
      description: 'Choose from trending hairstyles'
    }
  ];

  // Theme classes
  const bgPrimary = isDark ? 'bg-black' : 'bg-white';
  const bgSecondary = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const bgTertiary = isDark ? 'bg-gray-800' : 'bg-gray-100';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const textTertiary = isDark ? 'text-gray-500' : 'text-gray-400';
  const borderColor = isDark ? 'border-gray-800' : 'border-gray-200';
  const borderColorLight = isDark ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`min-h-screen ${bgPrimary} ${textPrimary} transition-colors duration-300`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 ${isDark ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-md border-b ${borderColor}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${isDark ? 'bg-white' : 'bg-gray-900'} rounded-xl flex items-center justify-center`}>
                <svg className={`w-6 h-6 ${isDark ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold">HairAI</span>
                <span className={`text-xs block ${textTertiary}`}>Transform Your Look</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <button
                onClick={openLoginModal}
                className={`${textSecondary} hover:${textPrimary} transition-colors px-3 py-2 text-sm`}
              >
                Sign In
              </button>
              <button
                onClick={openRegisterModal}
                className={`${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} px-4 py-2 rounded-lg font-medium text-sm transition-colors`}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 ${bgSecondary} rounded-full text-sm ${textSecondary} mb-6`}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            AI-Powered Hair Simulation
          </div>
          <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${textPrimary}`}>
            See Your New Look
            <br />
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Before You Commit</span>
          </h1>
          <p className={`text-lg ${textSecondary} mb-8 max-w-2xl mx-auto`}>
            Upload your photo and instantly preview different hairstyles using advanced AI technology.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#try-now"
              className={`${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} px-6 py-3 rounded-lg font-medium transition-colors`}
            >
              Try It Free
            </a>
            <button
              onClick={openRegisterModal}
              className={`border ${borderColorLight} ${textPrimary} px-6 py-3 rounded-lg font-medium hover:${bgSecondary} transition-colors`}
            >
              Create Account
            </button>
          </div>
          <p className={`mt-3 ${textTertiary} text-sm`}>
            {remainingTrials > 0
              ? `${remainingTrials} free trial${remainingTrials > 1 ? 's' : ''} remaining`
              : 'Sign up for more generations!'
            }
          </p>
        </div>
      </section>

      {/* Before/After Comparison Section */}
      <section className={`py-16 px-4 ${bgSecondary}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Side - Context */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${textPrimary}`}>See the Transformation</h2>
              <p className={`${textSecondary} mb-6 text-sm md:text-base`}>
                Experience the power of AI-driven hairstyle transformation. Our advanced technology
                seamlessly visualizes how different hairstyles would look on you.
              </p>

              {/* Feature bullets */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={`text-sm ${textSecondary}`}>Realistic hair simulation</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={`text-sm ${textSecondary}`}>Multiple style options</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={`text-sm ${textSecondary}`}>Instant results in seconds</span>
                </div>
              </div>

              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Drag the slider to compare before and after
              </p>
            </div>

            {/* Right Side - Slider */}
            <div className="flex-1 w-full max-w-md">
              <div
                ref={sliderRef}
                className="relative w-full aspect-[3/4] rounded-xl overflow-hidden cursor-ew-resize select-none shadow-2xl"
                onMouseDown={handleSliderMouseDown}
                onTouchMove={handleSliderTouchMove}
              >
                {/* After Image (Background) */}
                <div className="absolute inset-0">
                  <img
                    src={imgAfter}
                    alt="After transformation"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Before Image (Clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img
                    src={imgBefore}
                    alt="Before transformation"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Slider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-lg"
                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
                  Before
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
                  After
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 px-4 ${bgPrimary}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-2xl font-bold text-center mb-10 ${textPrimary}`}>Why Choose HairAI</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${bgSecondary} border ${borderColor} rounded-xl p-6 text-center hover:border-gray-600 transition-colors`}
              >
                <div className={`w-12 h-12 ${bgTertiary} rounded-full flex items-center justify-center mx-auto mb-4 ${textPrimary}`}>
                  {feature.icon}
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>{feature.title}</h3>
                <p className={textSecondary}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Try Now Section */}
      <section id="try-now" className={`py-16 px-4 ${bgSecondary}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-2xl font-bold text-center mb-2 ${textPrimary}`}>Try It Now</h2>
          <p className={`${textSecondary} text-center mb-8`}>
            Upload your photo and select a hairstyle
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6 text-center max-w-2xl mx-auto">
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

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className={`${bgPrimary} border ${borderColor} rounded-xl p-6`}>
              <h3 className={`text-base font-semibold mb-4 ${textPrimary}`}>1. Upload Your Photo</h3>
              <div
                onClick={() => remainingTrials > 0 && fileInputRef.current?.click()}
                className={`border-2 border-dashed ${borderColorLight} rounded-xl p-6 text-center ${
                  remainingTrials > 0 ? 'cursor-pointer hover:border-gray-500' : 'opacity-50 cursor-not-allowed'
                } transition-colors`}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <svg className={`w-10 h-10 mx-auto ${textTertiary} mb-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className={textSecondary}>Click to upload</p>
                    <p className={`${textTertiary} text-xs mt-1`}>JPG, PNG up to 10MB</p>
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

              {/* AI Model Selection */}
              <h3 className={`text-base font-semibold mt-5 mb-3 ${textPrimary}`}>2. Choose AI Model</h3>
              <div className="grid grid-cols-2 gap-2">
                {modelOptions.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => {
                      if (remainingTrials > 0) {
                        setSelectedModel(model.value);
                        setSelectedStyle('');
                        setSelectedHairColor('');
                      }
                    }}
                    disabled={remainingTrials <= 0}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedModel === model.value
                        ? isDark ? 'border-white bg-white/10' : 'border-gray-900 bg-gray-900/10'
                        : `${borderColorLight} hover:border-gray-500`
                    } ${remainingTrials <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className={`font-medium text-sm ${textPrimary}`}>{model.label}</p>
                    <p className={`${textTertiary} text-xs`}>{model.description}</p>
                  </button>
                ))}
              </div>

              {/* Gender Selection */}
              <h3 className={`text-base font-semibold mt-4 mb-3 ${textPrimary}`}>3. Select Gender</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (remainingTrials > 0) {
                      setSelectedGender('male');
                      setSelectedStyle('');
                    }
                  }}
                  disabled={remainingTrials <= 0}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedGender === 'male'
                      ? isDark ? 'border-white bg-white/10' : 'border-gray-900 bg-gray-900/10'
                      : `${borderColorLight} hover:border-gray-500`
                  } ${remainingTrials <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`font-medium text-sm ${textPrimary}`}>Male</span>
                </button>
                <button
                  onClick={() => {
                    if (remainingTrials > 0) {
                      setSelectedGender('female');
                      setSelectedStyle('');
                    }
                  }}
                  disabled={remainingTrials <= 0}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedGender === 'female'
                      ? isDark ? 'border-white bg-white/10' : 'border-gray-900 bg-gray-900/10'
                      : `${borderColorLight} hover:border-gray-500`
                  } ${remainingTrials <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`font-medium text-sm ${textPrimary}`}>Female</span>
                </button>
              </div>

              <h3 className={`text-base font-semibold mt-4 mb-3 ${textPrimary}`}>4. Select a Hairstyle</h3>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {hairStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => remainingTrials > 0 && setSelectedStyle(style.id)}
                    disabled={remainingTrials <= 0}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      selectedStyle === style.id
                        ? isDark ? 'border-white bg-white/10' : 'border-gray-900 bg-gray-900/10'
                        : `${borderColorLight} hover:border-gray-500`
                    } ${remainingTrials <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className={`font-medium text-xs ${textPrimary}`}>{style.name}</p>
                    <p className={`${textTertiary} text-xs`}>{style.description}</p>
                  </button>
                ))}
              </div>

              {/* Hair Color Selection - Available for both models */}
              <h3 className={`text-base font-semibold mt-4 mb-3 ${textPrimary}`}>5. Select Hair Color</h3>
              <div className="grid grid-cols-4 gap-2">
                {hairColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => remainingTrials > 0 && setSelectedHairColor(color.id)}
                    disabled={remainingTrials <= 0}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      selectedHairColor === color.id
                        ? isDark ? 'border-white bg-white/10' : 'border-gray-900 bg-gray-900/10'
                        : `${borderColorLight} hover:border-gray-500`
                    } ${remainingTrials <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className={`font-medium text-xs ${textPrimary}`}>{color.name}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedImage || !selectedStyle || remainingTrials <= 0}
                className={`w-full mt-5 py-3 rounded-lg font-medium transition-colors ${
                  isGenerating || !selectedImage || !selectedStyle || remainingTrials <= 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isGenerating ? 'Generating...' : `Generate with ${selectedModel === 'gemini' ? 'Gemini' : 'Replicate'}`}
              </button>
            </div>

            {/* Result Section */}
            <div className={`${bgPrimary} border ${borderColor} rounded-xl p-6`}>
              <h3 className={`text-base font-semibold mb-4 ${textPrimary}`}>Result</h3>
              <div className={`border-2 border-dashed ${borderColorLight} rounded-xl p-6 min-h-[350px] flex items-center justify-center`}>
                {isGenerating ? (
                  <div className="text-center">
                    <div className={`w-10 h-10 border-4 ${isDark ? 'border-gray-600 border-t-white' : 'border-gray-300 border-t-gray-900'} rounded-full animate-spin mx-auto mb-3`}></div>
                    <p className={textSecondary}>Generating your new look...</p>
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="max-h-72 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className={`text-center ${textTertiary}`}>
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <p>Your result will appear here</p>
                  </div>
                )}
              </div>

              {generatedImage && (
                <div className="mt-4 text-center">
                  <p className={`${textSecondary} text-sm mb-3`}>
                    Like what you see? Sign up for more!
                  </p>
                  <button
                    onClick={openRegisterModal}
                    className={`${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} px-5 py-2 rounded-lg font-medium text-sm transition-colors`}
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
      <section className={`py-16 px-4 ${bgPrimary}`}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${textPrimary}`}>Ready to Transform?</h2>
          <p className={`${textSecondary} mb-6`}>
            Join thousands of users who have discovered their perfect hairstyle
          </p>
          <button
            onClick={openRegisterModal}
            className={`${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} px-6 py-3 rounded-lg font-medium transition-colors`}
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-6 px-4 border-t ${borderColor}`}>
        <div className={`max-w-7xl mx-auto text-center ${textTertiary} text-sm`}>
          <p>&copy; 2024 HairAI. All rights reserved.</p>
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
