import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import ImageCompareSlider from '../components/ImageCompareSlider';
import api from '../utils/api';
import ImageCropModal from '../components/ImageCropModal';

const Simulation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' or 'sideBySide'

  // Queue status
  const [queueStatus, setQueueStatus] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimerRef = useRef(null);

  // Generation limit
  const [generationLimit, setGenerationLimit] = useState({ generationCount: 0, limit: 5, remaining: 5 });

  // AI Model selection
  const [aiModel, setAiModel] = useState('replicate');

  // Replicate options
  const [haircut, setHaircut] = useState('Random');
  const [hairColor, setHairColor] = useState('Random');
  const [gender, setGender] = useState('male');

  // AI Model options
  const aiModelOptions = [
    { value: 'replicate', label: 'Replicate (Default)', description: 'Fast and reliable' },
    { value: 'gemini', label: 'Google Gemini', description: 'Advanced AI generation' }
  ];

  // Exact options from Replicate API (flux-kontext-apps/change-haircut) - organized by category
  const haircutCategories = {
    general: ['No change', 'Random'],
    male: [
      'Crew Cut', 'Undercut', 'Mohawk', 'Faux Hawk', 'Mohawk Fade',
      'Slicked Back', 'Side-Parted'
    ],
    female: [
      'Bob', 'Pixie Cut', 'Lob', 'Angled Bob', 'A-Line Bob', 'Asymmetrical Bob',
      'Graduated Bob', 'Inverted Bob', 'Sideswept Pixie', 'Pageboy',
      'Messy Bun', 'High Ponytail', 'Low Ponytail', 'Braided Ponytail',
      'Space Buns', 'Top Knot', 'Pigtails', 'Half-Up Top Knot', 'Half-Up, Half-Down',
      'French Braid', 'Dutch Braid', 'Fishtail Braid', 'Box Braids', 'Crochet Braids',
      'Double Dutch Braids', 'French Fishtail Braid', 'Waterfall Braid', 'Rope Braid',
      'Heart Braid', 'Halo Braid', 'Crown Braid', 'Braided Crown', 'Bubble Braid',
      'Bubble Ponytail', 'Ballerina Braids', 'Milkmaid Braids', 'Bohemian Braids',
      'Messy Fishtail Braid',
      'Chignon', 'Simple Chignon', 'Messy Chignon', 'French Twist', 'French Twist Updo',
      'French Roll', 'Updo', 'Messy Updo', 'Knotted Updo', 'Ballerina Bun',
      'Banana Clip Updo', 'Beehive', 'Bouffant', 'Hair Bow', 'Twisted Bun',
      'Twisted Half-Updo', 'Twist and Pin Updo',
      'Messy Bun with a Headband', 'Messy Bun with a Scarf',
      'Blunt Bangs', 'Side-Swept Bangs', 'Victory Rolls',
      'Glamorous Waves', 'Hollywood Waves', 'Finger Waves', 'Pin Curls', 'Rollerset'
    ],
    unisex: [
      'Straight', 'Wavy', 'Curly', 'Layered', 'Shag', 'Layered Shag', 'Choppy Layers',
      'Center-Parted', 'Razor Cut', 'Perm', 'Ombré', 'Straightened',
      'Soft Waves', 'Tousled', 'Feathered',
      'Twist Out', 'Bantu Knots', 'Dreadlocks', 'Cornrows',
      'Flat Twist', 'Crown Twist', 'Zig-Zag Part'
    ]
  };

  const hairColorOptions = [
    'No change', 'Random', 'Blonde', 'Brunette', 'Black', 'Dark Brown', 'Medium Brown',
    'Light Brown', 'Auburn', 'Copper', 'Red', 'Strawberry Blonde', 'Platinum Blonde',
    'Silver', 'White', 'Blue', 'Purple', 'Pink', 'Green', 'Blue-Black', 'Golden Blonde',
    'Honey Blonde', 'Caramel', 'Chestnut', 'Mahogany', 'Burgundy', 'Jet Black',
    'Ash Brown', 'Ash Blonde', 'Titanium', 'Rose Gold'
  ];

  // Gemini-specific hairstyle options - organized by gender
  const geminiHaircutCategories = {
    general: ['no change'],
    male: [
      'buzz cut',
      'crew cut',
      'fade haircut',
      'high fade',
      'low fade',
      'mid fade',
      'skin fade',
      'taper fade',
      'undercut',
      'disconnected undercut',
      'mohawk',
      'faux hawk',
      'pompadour',
      'modern pompadour',
      'quiff',
      'textured quiff',
      'slick back undercut',
      'comb over',
      'hard part',
      'side part',
      'french crop',
      'textured crop',
      'caesar cut',
      'ivy league',
      'man bun',
      'top knot for men',
      'curtain bangs for men',
      'edgar cut',
      'mullet',
      'modern mullet',
      'spiky hair',
      'messy fringe',
      'textured fringe',
      'short and spiky',
      'long on top short sides',
      'business professional cut',
      'slicked back hair',
      'side-parted hair',
      'middle-parted hair'
    ],
    female: [
      'bob cut',
      'pixie cut',
      'long layered hair',
      'short cropped hair',
      'shaggy layers',
      'blunt cut',
      'feathered layers',
      'high ponytail',
      'low bun',
      'braided hair',
      'long straight hair',
      'shoulder length waves',
      'lob haircut',
      'asymmetrical bob',
      'bangs with long hair',
      'curtain bangs',
      'side swept bangs',
      'half up half down',
      'messy bun',
      'french braid',
      'dutch braid',
      'fishtail braid',
      'space buns',
      'top knot',
      'chignon',
      'updo',
      'beach waves',
      'glamorous waves',
      'hollywood waves'
    ],
    unisex: [
      'natural waves',
      'sleek straight hair',
      'voluminous curls',
      'beach waves',
      'tight curls',
      'messy textured hair',
      'afro',
      'dreadlocks',
      'cornrows'
    ]
  };

  // Gemini-specific hair color options
  const geminiHairColorOptions = [
    'natural',
    'blonde',
    'brunette',
    'black',
    'dark brown',
    'light brown',
    'auburn',
    'red',
    'strawberry blonde',
    'platinum blonde',
    'silver',
    'gray',
    'copper',
    'honey blonde',
    'caramel',
    'chestnut',
    'burgundy',
    'jet black',
    'ash blonde',
    'rose gold',
    'pastel pink',
    'pastel blue',
    'pastel purple',
    'vibrant red',
    'ombre blonde to brown',
    'ombre brown to blonde',
    'balayage highlights'
  ];


  // Update generation limit based on user verification status
  useEffect(() => {
    if (user) {
      const isVerified = user.emailVerified || false;
      const count = user.generationCount || 0;
      const limit = isVerified ? 5 : 0;
      setGenerationLimit({
        generationCount: count,
        limit: limit,
        remaining: Math.max(0, limit - count)
      });
    }
  }, [user]);

  // Fetch queue status on mount and periodically
  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const response = await api.get('/simulation/queue-status');
        if (response.data.success) {
          setQueueStatus(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch queue status:', err);
      }
    };

    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Elapsed time timer during generation
  useEffect(() => {
    if (isGenerating) {
      setElapsedTime(0);
      elapsedTimerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }

    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, [isGenerating]);

  // Format seconds to readable time
  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Store raw image and show crop modal
      setRawImage(e.target.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (croppedImage) => {
    setUploadedImage(croppedImage);
    setShowCropModal(false);
    setRawImage(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setRawImage(null);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setResultImage(null);
    setError('');
  };

  const handleReset = () => {
    setAiModel('replicate');
    setHaircut('Random');
    setHairColor('Random');
    setGender('male');
    setError('');
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    // Check if user is verified
    if (!user?.emailVerified) {
      setError('Please verify your email to unlock 5 free generations.');
      return;
    }

    // Check generation limit
    if (generationLimit.remaining <= 0) {
      setError('You have used all your free generations.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/simulation/generate', {
        imageBase64: uploadedImage,
        haircut: haircut,
        hair_color: hairColor,
        gender: gender,
        model: aiModel
      });

      if (response.data.success) {
        setResultImage(response.data.data.resultImage);
        // Update generation limit after successful generation
        setGenerationLimit(prev => ({
          ...prev,
          generationCount: prev.generationCount + 1,
          remaining: prev.remaining - 1
        }));
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.requiresVerification) {
        setError('Please verify your email to unlock 5 free generations.');
      } else if (errorData?.limitReached) {
        setError(`You have used all ${errorData.limit} free generations.`);
        setGenerationLimit({
          generationCount: errorData.generationCount,
          limit: errorData.limit,
          remaining: 0
        });
      } else {
        setError(errorData?.message || 'Failed to generate simulation. Please try again.');
      }
      console.error('Simulation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!uploadedImage || !resultImage) {
      setError('No simulation to save');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/history', {
        originalImage: uploadedImage,
        resultImage: resultImage,
        haircut: haircut,
        hairColor: hairColor,
        gender: gender
      });

      if (response.data.success) {
        setSuccess('Simulation saved to history!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save simulation');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) {
      setError('No image to download');
      return;
    }

    try {
      // Create a temporary link element
      const link = document.createElement('a');

      // If resultImage is a URL (from Cloudinary), fetch it first
      if (resultImage.startsWith('http')) {
        const response = await fetch(resultImage);
        const blob = await response.blob();
        link.href = URL.createObjectURL(blob);
      } else {
        // If it's a base64 image
        link.href = resultImage;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `hair-simulation-${timestamp}.png`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL if created
      if (resultImage.startsWith('http')) {
        URL.revokeObjectURL(link.href);
      }

      setSuccess('Image downloaded!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to download image');
      console.error('Download error:', err);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      {/* Email Verification Banner */}
      <EmailVerificationBanner />

      {/* Image Crop Modal */}
      {showCropModal && rawImage && (
        <ImageCropModal
          imageUrl={rawImage}
          onCrop={handleCropConfirm}
          onCancel={handleCropCancel}
          cropSize={512}
        />
      )}

      {/* Error Toast - Fixed position, doesn't affect layout */}
      {error && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-red-900 bg-opacity-90 border border-red-700 text-red-200 px-4 py-3 rounded-lg shadow-lg max-w-sm mx-4 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm flex-1">{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-300 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-green-900 bg-opacity-90 border border-green-700 text-green-200 px-4 py-3 rounded-lg shadow-lg max-w-sm mx-4 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm flex-1">{success}</span>
          <button
            onClick={() => setSuccess('')}
            className="text-green-300 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Responsive Navbar */}
      <header className={`${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <h1 className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Hair Simulation</h1>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}
            >
              Dashboard
            </button>
            <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
            <button
              onClick={() => navigate('/profile')}
              className={`flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className={`w-6 h-6 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                  <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              {user?.username}
            </button>
            <button
              onClick={handleLogout}
              className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} px-4 py-2 rounded-lg transition-colors text-sm`}
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden ${isDark ? 'text-white' : 'text-gray-900'} p-2`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className={`md:hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} border-t px-4 py-3 space-y-3`}>
            <button
              onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
              className={`flex items-center gap-2 w-full text-left ${isDark ? 'text-white' : 'text-gray-900'} py-2 text-sm`}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              {user?.username}
            </button>
            <button
              onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
              className={`block w-full text-left ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} py-2 text-sm`}
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className={`block w-full ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} px-4 py-2 rounded-lg text-sm text-center`}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Content - Mobile: Column, Desktop: Row */}
      <main className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">

        {/* Image Upload/Display Area - Comes first on mobile */}
        <div
          className={`flex-1 flex items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-100'} p-4 md:p-8 order-1 lg:order-2 transition-colors duration-300`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!uploadedImage ? (
            /* Upload Area */
            <div className="text-center w-full max-w-sm">
              <div className={`border-2 border-dashed ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'} rounded-lg p-6 md:p-12 transition-colors`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg
                    className={`w-12 h-12 md:w-16 md:h-16 ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-3 md:mb-4`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium mb-1 text-sm md:text-base`}>
                    Tap to upload photo
                  </span>
                  <span className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs md:text-sm`}>
                    PNG, JPG up to 10MB
                  </span>
                </label>
              </div>
            </div>
          ) : !resultImage ? (
            /* Uploaded Image Preview */
            <div className="relative w-full max-w-[300px] md:max-w-[400px]">
              <div className={`aspect-square ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-lg overflow-hidden border relative`}>
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 md:top-3 md:right-3 bg-red-600 hover:bg-red-700 text-white p-1.5 md:p-2 rounded-lg transition-colors"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {isGenerating && (
                  <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-white mx-auto mb-3"></div>
                      <p className="text-sm md:text-base font-medium mb-1">Generating your new look...</p>
                      <p className="text-xs text-gray-300 mb-2">
                        Elapsed: {formatTime(elapsedTime)}
                      </p>
                      {queueStatus && queueStatus.activeJobs > 1 && (
                        <div className="mt-2 text-xs text-gray-400 bg-gray-800 bg-opacity-50 rounded-lg px-3 py-2">
                          <div className="flex items-center justify-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{queueStatus.activeJobs} jobs in queue</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-center mt-3 text-xs md:text-sm`}>
                Image ready. Configure settings below and generate.
              </p>
            </div>
          ) : (
            /* Before/After Result */
            <div className="w-full max-w-4xl px-2">
              {/* View Mode Toggle */}
              <div className="flex justify-center mb-4">
                <div className="bg-gray-800 rounded-lg p-1 flex gap-1">
                  <button
                    onClick={() => setViewMode('slider')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      viewMode === 'slider'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                    Slider
                  </button>
                  <button
                    onClick={() => setViewMode('sideBySide')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      viewMode === 'sideBySide'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Side by Side
                  </button>
                </div>
              </div>

              {/* Slider View */}
              {viewMode === 'slider' ? (
                <div className="flex justify-center">
                  <div className="w-full max-w-[350px] md:max-w-[450px]">
                    <ImageCompareSlider
                      beforeImage={uploadedImage}
                      afterImage={resultImage}
                    />
                  </div>
                </div>
              ) : (
                /* Side by Side View */
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-center">
                  {/* Before Image */}
                  <div className="text-center w-full max-w-[280px] md:max-w-[350px]">
                    <p className="text-gray-400 text-xs md:text-sm mb-2 md:mb-3">Before</p>
                    <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                      <img
                        src={uploadedImage}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Arrow - Hidden on mobile, shown on desktop */}
                  <div className="hidden md:block text-4xl text-gray-600">→</div>

                  {/* Arrow - Mobile vertical */}
                  <div className="md:hidden text-2xl text-gray-600">↓</div>

                  {/* After Image */}
                  <div className="text-center w-full max-w-[280px] md:max-w-[350px]">
                    <p className="text-gray-400 text-xs md:text-sm mb-2 md:mb-3">After</p>
                    <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden border border-white">
                      <img
                        src={resultImage}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-4 md:px-6 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                    isSaving
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors text-sm"
                >
                  Try Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel - Below on mobile, Left side on desktop */}
        <aside className={`w-full lg:w-80 ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-t lg:border-t-0 lg:border-r p-4 md:p-6 order-2 lg:order-1 lg:overflow-y-auto transition-colors duration-300`}>
          <h2 className={`text-base md:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 md:mb-6`}>Settings</h2>

          <div className="space-y-4 md:space-y-5">
            {/* AI Model Selection */}
            <div>
              <label className={`block text-xs md:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1.5 md:mb-2`}>
                AI Model
              </label>
              <select
                value={aiModel}
                onChange={(e) => {
                  setAiModel(e.target.value);
                  // Reset options when switching models
                  if (e.target.value === 'gemini') {
                    setHaircut('no change');
                    setHairColor('natural');
                  } else {
                    setHaircut('Random');
                    setHairColor('Random');
                  }
                }}
                className={`w-full ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border px-2 md:px-3 py-2 rounded-lg focus:outline-none ${isDark ? 'focus:border-gray-600' : 'focus:border-gray-400'} text-xs md:text-sm`}
              >
                {aiModelOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {aiModelOptions.find(m => m.value === aiModel)?.description}
              </p>
            </div>

            {/* Divider */}
            <div className={`h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>

            {/* Gender Selection - Show for both models */}
            <div>
              <label className={`block text-xs md:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1.5 md:mb-2`}>
                Gender
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setGender('male');
                    // Reset haircut when changing gender
                    if (aiModel === 'gemini') {
                      setHaircut('no change');
                    } else {
                      setHaircut('Random');
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    gender === 'male'
                      ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                      : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => {
                    setGender('female');
                    // Reset haircut when changing gender
                    if (aiModel === 'gemini') {
                      setHaircut('no change');
                    } else {
                      setHaircut('Random');
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    gender === 'female'
                      ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                      : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Dropdowns in a grid on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4 lg:gap-5">
              {/* Haircut Dropdown */}
              <div>
                <label className={`block text-xs md:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1.5 md:mb-2`}>
                  Hairstyle
                </label>
                <select
                  value={haircut}
                  onChange={(e) => setHaircut(e.target.value)}
                  className={`w-full ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border px-2 md:px-3 py-2 rounded-lg focus:outline-none ${isDark ? 'focus:border-gray-600' : 'focus:border-gray-400'} text-xs md:text-sm`}
                >
                  {aiModel === 'gemini' ? (
                    // Gemini hairstyle options - filtered by gender
                    <>
                      {geminiHaircutCategories.general.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                      {gender === 'male' && (
                        <>
                          <optgroup label="Male Styles">
                            {geminiHaircutCategories.male.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Unisex Styles">
                            {geminiHaircutCategories.unisex.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                        </>
                      )}
                      {gender === 'female' && (
                        <>
                          <optgroup label="Female Styles">
                            {geminiHaircutCategories.female.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Unisex Styles">
                            {geminiHaircutCategories.unisex.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </>
                  ) : (
                    // Replicate hairstyle options - filtered by gender
                    <>
                      {haircutCategories.general.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                      {gender === 'male' && (
                        <>
                          <optgroup label="Male Styles">
                            {haircutCategories.male.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Unisex Styles">
                            {haircutCategories.unisex.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                        </>
                      )}
                      {gender === 'female' && (
                        <>
                          <optgroup label="Female Styles">
                            {haircutCategories.female.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Unisex Styles">
                            {haircutCategories.unisex.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </>
                  )}
                </select>
              </div>

              {/* Hair Color Dropdown */}
              <div>
                <label className={`block text-xs md:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1.5 md:mb-2`}>
                  Hair Color
                </label>
                <select
                  value={hairColor}
                  onChange={(e) => setHairColor(e.target.value)}
                  className={`w-full ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border px-2 md:px-3 py-2 rounded-lg focus:outline-none ${isDark ? 'focus:border-gray-600' : 'focus:border-gray-400'} text-xs md:text-sm`}
                >
                  {aiModel === 'gemini' ? (
                    // Gemini hair color options
                    geminiHairColorOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))
                  ) : (
                    // Replicate hair color options
                    hairColorOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))
                  )}
                </select>
              </div>

            </div>

            {/* Divider - Hidden on mobile */}
            <div className={`hidden lg:block h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'} my-6`}></div>

            {/* Generation Limit Status */}
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 mb-3`}>
              {!user?.emailVerified ? (
                // Unverified user - show verification prompt
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      Email not verified
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                      Verify your email to unlock 5 free generations
                    </p>
                  </div>
                </div>
              ) : (
                // Verified user - show generation count
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    generationLimit.remaining > 0
                      ? isDark ? 'bg-green-900/50' : 'bg-green-100'
                      : isDark ? 'bg-red-900/50' : 'bg-red-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      generationLimit.remaining > 0
                        ? isDark ? 'text-green-400' : 'text-green-600'
                        : isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {generationLimit.remaining}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {generationLimit.remaining > 0
                        ? `${generationLimit.remaining} generation${generationLimit.remaining !== 1 ? 's' : ''} remaining`
                        : 'No generations remaining'
                      }
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {generationLimit.generationCount} of {generationLimit.limit} used
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Queue Status Indicator */}
            {queueStatus && queueStatus.activeJobs > 0 && !isGenerating && (
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 mb-3`}>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {queueStatus.activeJobs} {queueStatus.activeJobs === 1 ? 'job' : 'jobs'} processing
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Est. wait: {queueStatus.formattedWaitTime}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex lg:flex-col gap-3">
              <button
                onClick={handleGenerate}
                disabled={!uploadedImage || isGenerating || !user?.emailVerified || generationLimit.remaining <= 0}
                className={`flex-1 lg:w-full py-2.5 md:py-3 rounded-lg font-medium text-xs md:text-sm transition-colors ${
                  !uploadedImage || isGenerating || !user?.emailVerified || generationLimit.remaining <= 0
                    ? isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={handleReset}
                className={`flex-1 lg:w-full ${isDark ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} py-2.5 md:py-3 rounded-lg font-medium text-xs md:text-sm transition-colors`}
              >
                Reset
              </button>
            </div>

            {/* Current Selection Info - Hidden on mobile */}
            <div className={`hidden lg:block mt-6 p-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Current Selection:</p>
              <div className="space-y-1 text-xs">
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Model: <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{aiModelOptions.find(m => m.value === aiModel)?.label}</span></p>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Gender: <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium capitalize`}>{gender}</span></p>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Hairstyle: <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{haircut}</span></p>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Color: <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{hairColor}</span></p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Simulation;
