import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSimulation } from '../context/SimulationContext';
import ImageCompareSlider from '../components/ImageCompareSlider';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import ImageCropModal from '../components/ImageCropModal';
import CameraModal from '../components/CameraModal';
import creditsIcon from '../assets/credits.png';

const Simulation = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { simulationState, updateSimulation } = useSimulation();

  // Initialize state from context (persisted state)
  const [uploadedImage, setUploadedImage] = useState(simulationState.uploadedImage);
  const [resultImage, setResultImage] = useState(simulationState.resultImage);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' or 'sideBySide'
  const [isSaved, setIsSaved] = useState(simulationState.isSaved); // Track if current result is saved

  // Pricing modal
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Queue status
  const [queueStatus, setQueueStatus] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimerRef = useRef(null);

  // Generation limit
  const [generationLimit, setGenerationLimit] = useState({ generationCount: 0, limit: 3, remaining: 3 });

  // Credit packages
  const [creditPackages, setCreditPackages] = useState([]);

  // AI Model selection - initialized from context
  const [aiModel, setAiModel] = useState(simulationState.aiModel);

  // Replicate options - initialized from context
  const [haircut, setHaircut] = useState(simulationState.haircut);
  const [hairColor, setHairColor] = useState(simulationState.hairColor);
  const [gender, setGender] = useState(simulationState.gender);

  // Custom input toggles for Gemini model - initialized from context
  const [useCustomHaircut, setUseCustomHaircut] = useState(simulationState.useCustomHaircut);
  const [useCustomHairColor, setUseCustomHairColor] = useState(simulationState.useCustomHairColor);

  // Persist state changes to context
  useEffect(() => {
    updateSimulation({
      uploadedImage,
      resultImage,
      haircut,
      hairColor,
      gender,
      aiModel,
      useCustomHaircut,
      useCustomHairColor,
      isSaved,
    });
  }, [uploadedImage, resultImage, haircut, hairColor, gender, aiModel, useCustomHaircut, useCustomHairColor, isSaved]);

  // AI Model options
  const aiModelOptions = [
    { value: 'gemini', label: 'Google Gemini (Default)', description: 'Advanced AI generation' },
    { value: 'replicate', label: 'Replicate', description: 'Fast and reliable' }
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


  // Fetch latest generation limit from API on page load
  useEffect(() => {
    const fetchGenerationLimit = async () => {
      if (!user) return;
      try {
        const response = await api.get('/subscription/status');
        if (response.data.success) {
          setGenerationLimit({
            generationCount: response.data.data.generationsUsed,
            limit: response.data.data.freeLimit,
            remaining: response.data.data.generationsRemaining,
            credits: response.data.data.credits
          });
        }
      } catch (err) {
        // Fallback to user object if API fails
        const count = user.generationCount || 0;
        const limit = user.freeLimit || 3;
        setGenerationLimit({
          generationCount: count,
          limit: limit,
          remaining: Math.max(0, limit - count),
          credits: user.credits || 0
        });
        console.error('Failed to fetch generation limit:', err);
      }
    };
    fetchGenerationLimit();
  }, [user]);

  // Fetch credit packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await api.get('/subscription/packages');
        if (response.data.success) {
          setCreditPackages(response.data.data.packages);
        }
      } catch (err) {
        console.error('Failed to fetch credit packages:', err);
      }
    };
    fetchPackages();
  }, []);

  // Prevent body scroll when pricing modal is open and prevent layout shift
  useEffect(() => {
    if (showPricingModal) {
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
  }, [showPricingModal]);

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

  const handleCameraCapture = (imageData) => {
    // Camera captured image goes through crop modal
    setRawImage(imageData);
    setShowCropModal(true);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setResultImage(null);
    setError('');
  };

  const handleReset = () => {
    setAiModel('gemini');
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

    // Check generation limit
    const canGenerate = generationLimit.remaining > 0 || generationLimit.credits > 0;

    if (!canGenerate) {
      setError(`You have used all ${generationLimit.limit} free generations. Buy credits for more!`);
      return;
    }

    // Determine if we need to use credits
    const needsCredit = generationLimit.remaining <= 0 && generationLimit.credits > 0;

    // Clear previous result to show generating state on the original image
    setResultImage(null);
    setIsSaved(false); // Reset saved state for new generation
    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/simulation/generate', {
        imageBase64: uploadedImage,
        haircut: haircut,
        hair_color: hairColor,
        gender: gender,
        model: aiModel,
        useCredit: needsCredit
      });

      if (response.data.success) {
        setResultImage(response.data.data.resultImage);

        // Update generation limit based on response
        if (response.data.data.generationInfo) {
          const info = response.data.data.generationInfo;
          setGenerationLimit({
            generationCount: info.count,
            limit: info.limit,
            remaining: info.remaining,
            credits: info.credits
          });
        } else {
          // Fallback local update
          if (response.data.data.usedCredit) {
            setGenerationLimit(prev => ({
              ...prev,
              credits: prev.credits - 1
            }));
          } else {
            setGenerationLimit(prev => ({
              ...prev,
              generationCount: prev.generationCount + 1,
              remaining: prev.remaining - 1
            }));
          }
        }

        if (response.data.data.usedCredit) {
          setSuccess('Generated using 1 credit!');
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.limitReached) {
        if (errorData?.canUseCredits) {
          setError(`Free limit reached. You have ${errorData.credits} credits available.`);
        } else {
          setError(`You have used all ${errorData.limit} free generations. Buy credits for more!`);
        }
        setGenerationLimit({
          generationCount: errorData.generationCount || generationLimit.generationCount,
          limit: errorData.limit || generationLimit.limit,
          remaining: 0,
          credits: errorData.credits || 0
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

    // Check if already saved
    if (isSaved) {
      setError('This simulation is already saved!');
      setTimeout(() => setError(''), 3000);
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
        setIsSaved(true); // Mark as saved
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

  const handlePurchase = async (packageId) => {
    try {
      // Create Stripe checkout session
      const response = await api.post('/payment/create-checkout-session', { packageId });

      if (response.data.success && response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      // Verify payment and add credits
      const verifyPayment = async () => {
        try {
          const response = await api.post('/payment/verify-payment', { sessionId });
          if (response.data.success) {
            if (!response.data.alreadyProcessed) {
              setSuccess(`Payment successful! Added ${response.data.creditsAdded} credits.`);
            }
            // Refresh generation limit
            const statusResponse = await api.get('/subscription/status');
            if (statusResponse.data.success) {
              setGenerationLimit({
                generationCount: statusResponse.data.data.generationsUsed,
                limit: statusResponse.data.data.freeLimit,
                remaining: statusResponse.data.data.generationsRemaining,
                credits: statusResponse.data.data.credits
              });
            }
          }
        } catch (err) {
          console.error('Payment verification error:', err);
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      };
      verifyPayment();
    } else if (paymentStatus === 'cancelled') {
      setError('Payment was cancelled');
      setTimeout(() => setError(''), 4000);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-100'} relative overflow-hidden`}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"></div>
      </div>
      {/* Image Crop Modal */}
      {showCropModal && rawImage && (
        <ImageCropModal
          imageUrl={rawImage}
          onCrop={handleCropConfirm}
          onCancel={handleCropCancel}
          cropSize={512}
        />
      )}

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
        isDark={isDark}
      />

      {/* Credit Packages Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className={`relative w-full max-w-[95vw] sm:max-w-lg md:max-w-4xl my-4 sm:my-8 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto`}>
            {/* Close button */}
            <button
              onClick={() => setShowPricingModal(false)}
              className={`absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center rounded-full ${isDark ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'} transition-colors z-10`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-4 sm:p-6 md:p-8">
              {/* Header */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-500/20 mb-3">
                  <img src={creditsIcon} alt="credits" className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  Buy Credits
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Get more generations with credit packages
                </p>
              </div>

              {/* Credit Package Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {creditPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-5 border-2 transition-all ${
                      pkg.popular
                        ? isDark ? 'border-yellow-500 bg-gray-800' : 'border-yellow-500 bg-yellow-50'
                        : pkg.bestValue
                        ? isDark ? 'border-green-500 bg-gray-800' : 'border-green-500 bg-green-50'
                        : isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {/* Badge */}
                    {pkg.popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-yellow-500 text-black text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                          POPULAR
                        </span>
                      </div>
                    )}
                    {pkg.bestValue && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                          BEST VALUE
                        </span>
                      </div>
                    )}

                    {/* Package name */}
                    <h3 className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-0.5 sm:mb-1 ${pkg.popular || pkg.bestValue ? 'mt-1' : ''}`}>
                      {pkg.name}
                    </h3>

                    {/* Credits */}
                    <div className="mb-1 sm:mb-2 flex items-center gap-1">
                      <img src={creditsIcon} alt="credits" className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {pkg.credits}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mb-2 sm:mb-3">
                      <span className={`text-base sm:text-lg font-bold ${pkg.popular ? 'text-yellow-500' : pkg.bestValue ? 'text-green-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                        ${pkg.price}
                      </span>
                      <p className={`text-[10px] sm:text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        ${pkg.pricePerCredit.toFixed(2)}/credit
                      </p>
                    </div>

                    {/* Savings badge - hidden on mobile for space */}
                    {pkg.savings && (
                      <div className={`hidden sm:block text-xs font-medium mb-2 sm:mb-3 ${pkg.popular ? 'text-yellow-500' : 'text-green-500'}`}>
                        {pkg.savings}
                      </div>
                    )}

                    {/* Button */}
                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      className={`w-full py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                        pkg.popular
                          ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                          : pkg.bestValue
                          ? 'bg-green-500 text-white hover:bg-green-400'
                          : isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      Buy
                    </button>
                  </div>
                ))}
              </div>

              {/* Current balance */}
              <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} text-center`}>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} flex flex-wrap items-center justify-center gap-1 sm:gap-2`}>
                  Your credits:
                  <span className="font-bold inline-flex items-center gap-1">
                    <img src={creditsIcon} alt="credits" className="w-4 h-4" />
                    {generationLimit.credits}
                  </span>
                  {generationLimit.remaining > 0 && (
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>+{generationLimit.remaining} free</span>
                  )}
                </p>
              </div>

              {/* Note */}
              <p className={`text-center text-[10px] sm:text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-3`}>
                Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </div>
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

      {/* Shared Navbar */}
      <Navbar />

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
              <div className={`border-2 border-dashed ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'} rounded-lg p-6 md:p-8 transition-colors`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />

                {/* Upload and Camera buttons */}
                <div className="flex flex-col items-center gap-4">
                  {/* Upload Button */}
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center group"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${isDark ? 'bg-gray-800 group-hover:bg-gray-700' : 'bg-gray-100 group-hover:bg-gray-200'} flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105`}>
                      <svg
                        className={`w-8 h-8 md:w-10 md:h-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium text-sm`}>
                      Upload Photo
                    </span>
                  </label>

                  <div className={`flex items-center gap-3 w-full`}>
                    <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>or</span>
                    <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  </div>

                  {/* Camera Button */}
                  <button
                    onClick={() => setShowCameraModal(true)}
                    className="flex flex-col items-center group"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105 shadow-lg`}>
                      <svg
                        className="w-8 h-8 md:w-10 md:h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium text-sm`}>
                      Take Photo
                    </span>
                  </button>

                  <span className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>
                    PNG, JPG up to 10MB
                  </span>
                </div>
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
                  disabled={isSaving || isSaved}
                  className={`px-4 md:px-6 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                    isSaving || isSaved
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                      Saving...
                    </>
                  ) : isSaved ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
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
              {/* Haircut Dropdown/Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <label className={`block text-xs md:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Hairstyle
                  </label>
                  {aiModel === 'gemini' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomHaircut(!useCustomHaircut);
                        if (!useCustomHaircut) setHaircut('');
                        else setHaircut('no change');
                      }}
                      className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full transition-colors ${
                        useCustomHaircut
                          ? 'bg-purple-500/20 text-purple-400'
                          : isDark ? 'bg-gray-700 text-gray-400 hover:text-gray-300' : 'bg-gray-200 text-gray-500 hover:text-gray-600'
                      }`}
                    >
                      {useCustomHaircut ? 'Use Preset' : 'Custom'}
                    </button>
                  )}
                </div>
                {aiModel === 'gemini' && useCustomHaircut ? (
                  <input
                    type="text"
                    value={haircut}
                    onChange={(e) => setHaircut(e.target.value)}
                    placeholder="Type any hairstyle..."
                    className={`w-full ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'} border px-2 md:px-3 py-2 rounded-lg focus:outline-none ${isDark ? 'focus:border-purple-500' : 'focus:border-purple-400'} text-xs md:text-sm`}
                  />
                ) : (
                  <select
                    value={haircut}
                    onChange={(e) => setHaircut(e.target.value)}
                    className={`w-full ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border px-2 md:px-3 py-2 rounded-lg focus:outline-none ${isDark ? 'focus:border-gray-600' : 'focus:border-gray-400'} text-xs md:text-sm`}
                  >
                    {aiModel === 'gemini' ? (
                      // Gemini hairstyle options - filtered by gender, sorted A-Z
                      <>
                        {geminiHaircutCategories.general.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                        {gender === 'male' && (
                          <optgroup label="Male Styles">
                            {[...geminiHaircutCategories.male].sort((a, b) => a.localeCompare(b)).map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                        )}
                        {gender === 'female' && (
                          <optgroup label="Female Styles">
                            {[...geminiHaircutCategories.female].sort((a, b) => a.localeCompare(b)).map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    ) : (
                      // Replicate hairstyle options - filtered by gender, sorted A-Z
                      <>
                        {haircutCategories.general.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                        {gender === 'male' && (
                          <optgroup label="Male Styles">
                            {[...haircutCategories.male].sort((a, b) => a.localeCompare(b)).map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                        )}
                        {gender === 'female' && (
                          <optgroup label="Female Styles">
                            {[...haircutCategories.female].sort((a, b) => a.localeCompare(b)).map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    )}
                  </select>
                )}
              </div>

              {/* Hair Color Dropdown/Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <label className={`block text-xs md:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Hair Color
                  </label>
                  {aiModel === 'gemini' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomHairColor(!useCustomHairColor);
                        if (!useCustomHairColor) setHairColor('');
                        else setHairColor('natural');
                      }}
                      className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full transition-colors ${
                        useCustomHairColor
                          ? 'bg-purple-500/20 text-purple-400'
                          : isDark ? 'bg-gray-700 text-gray-400 hover:text-gray-300' : 'bg-gray-200 text-gray-500 hover:text-gray-600'
                      }`}
                    >
                      {useCustomHairColor ? 'Use Preset' : 'Custom'}
                    </button>
                  )}
                </div>
                {aiModel === 'gemini' && useCustomHairColor ? (
                  <input
                    type="text"
                    value={hairColor}
                    onChange={(e) => setHairColor(e.target.value)}
                    placeholder="Type any hair color..."
                    className={`w-full ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'} border px-2 md:px-3 py-2 rounded-lg focus:outline-none ${isDark ? 'focus:border-purple-500' : 'focus:border-purple-400'} text-xs md:text-sm`}
                  />
                ) : (
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
                )}
              </div>

            </div>

            {/* Divider - Hidden on mobile */}
            <div className={`hidden lg:block h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'} my-6`}></div>

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
                disabled={!uploadedImage || isGenerating || (generationLimit.remaining <= 0 && generationLimit.credits <= 0)}
                className={`flex-1 lg:w-full py-2.5 md:py-3 rounded-xl font-semibold text-xs md:text-sm transition-all ${
                  !uploadedImage || isGenerating || (generationLimit.remaining <= 0 && generationLimit.credits <= 0)
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25'
                }`}
              >
                {isGenerating ? 'Generating...' : generationLimit.remaining <= 0 && generationLimit.credits > 0 ? `Generate (Use Credit)` : 'Generate'}
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
