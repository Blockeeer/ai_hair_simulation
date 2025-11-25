import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Simulation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Replicate options
  const [haircut, setHaircut] = useState('Random');
  const [hairColor, setHairColor] = useState('Random');
  const [gender, setGender] = useState('Auto-detect');

  // Options from Replicate playground
  const haircutOptions = [
    'Random', 'Afro', 'Bob', 'Bowl cut', 'Braids', 'Bun', 'Buzz cut',
    'Cornrows', 'Crew cut', 'Curly', 'Dreadlocks', 'Fade', 'Long hair',
    'Mohawk', 'Mullet', 'Pixie cut', 'Pompadour', 'Ponytail', 'Short hair',
    'Side part', 'Straight hair', 'Undercut', 'Wavy hair', 'Wolf cut'
  ];

  const hairColorOptions = [
    'Random', 'Black', 'Blonde', 'Brown', 'Red', 'Gray',
    'White', 'Blue', 'Green', 'Pink', 'Purple'
  ];

  const genderOptions = ['Auto-detect', 'Male', 'Female'];

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const SIZE = 512;
        canvas.width = SIZE;
        canvas.height = SIZE;

        const scale = Math.max(SIZE / img.width, SIZE / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        const x = (SIZE - scaledWidth) / 2;
        const y = (SIZE - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        const processedImage = canvas.toDataURL('image/jpeg', 1.0);
        setUploadedImage(processedImage);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setResultImage(null);
    setError('');
  };

  const handleReset = () => {
    setHaircut('Random');
    setHairColor('Random');
    setGender('Auto-detect');
    setError('');
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await api.post('/simulation/generate', {
        imageBase64: uploadedImage,
        haircut: haircut,
        hair_color: hairColor,
        gender: gender
      });

      if (response.data.success) {
        setResultImage(response.data.data.resultImage);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate simulation. Please try again.');
      console.error('Simulation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
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

      {/* Responsive Navbar */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <h1 className="text-lg md:text-xl font-bold text-white">AI Hair Simulation</h1>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Dashboard
            </button>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400 text-sm">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
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
          <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">{user?.username}</span>
            </div>
            <button
              onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
              className="block w-full text-left text-gray-400 hover:text-white py-2 text-sm"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="block w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm text-center"
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
          className="flex-1 flex items-center justify-center bg-black p-4 md:p-8 order-1 lg:order-2"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!uploadedImage ? (
            /* Upload Area */
            <div className="text-center w-full max-w-sm">
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 md:p-12 hover:border-gray-600 transition-colors">
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
                    className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mb-3 md:mb-4"
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
                  <span className="text-white font-medium mb-1 text-sm md:text-base">
                    Tap to upload photo
                  </span>
                  <span className="text-gray-500 text-xs md:text-sm">
                    PNG, JPG up to 10MB
                  </span>
                </label>
              </div>
            </div>
          ) : !resultImage ? (
            /* Uploaded Image Preview */
            <div className="relative w-full max-w-[300px] md:max-w-[400px]">
              <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-800 relative">
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
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-white mx-auto mb-2 md:mb-3"></div>
                      <p className="text-xs md:text-sm">Generating...</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-center mt-3 text-xs md:text-sm">
                Image ready. Configure settings below and generate.
              </p>
            </div>
          ) : (
            /* Before/After Result */
            <div className="w-full max-w-4xl px-2">
              {/* Mobile: Stack vertically, Desktop: Side by side */}
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

              {/* Try Another Button */}
              <div className="text-center mt-6">
                <button
                  onClick={handleRemoveImage}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors text-sm"
                >
                  Try Another Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel - Below on mobile, Left side on desktop */}
        <aside className="w-full lg:w-80 bg-black border-t lg:border-t-0 lg:border-r border-gray-800 p-4 md:p-6 order-2 lg:order-1 lg:overflow-y-auto">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Settings</h2>

          <div className="space-y-4 md:space-y-5">
            {/* Dropdowns in a grid on mobile */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 md:gap-4 lg:gap-5">
              {/* Haircut Dropdown */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                  Haircut
                </label>
                <select
                  value={haircut}
                  onChange={(e) => setHaircut(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white px-2 md:px-3 py-2 rounded-lg focus:outline-none focus:border-gray-600 text-xs md:text-sm"
                >
                  {haircutOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Hair Color Dropdown */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                  Hair Color
                </label>
                <select
                  value={hairColor}
                  onChange={(e) => setHairColor(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white px-2 md:px-3 py-2 rounded-lg focus:outline-none focus:border-gray-600 text-xs md:text-sm"
                >
                  {hairColorOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Gender Dropdown */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white px-2 md:px-3 py-2 rounded-lg focus:outline-none focus:border-gray-600 text-xs md:text-sm"
                >
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Divider - Hidden on mobile */}
            <div className="hidden lg:block h-px bg-gray-800 my-6"></div>

            {/* Action Buttons */}
            <div className="flex lg:flex-col gap-3">
              <button
                onClick={handleGenerate}
                disabled={!uploadedImage || isGenerating}
                className={`flex-1 lg:w-full py-2.5 md:py-3 rounded-lg font-medium text-xs md:text-sm transition-colors ${
                  !uploadedImage || isGenerating
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 lg:w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 md:py-3 rounded-lg font-medium text-xs md:text-sm transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Current Selection Info - Hidden on mobile */}
            <div className="hidden lg:block mt-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 mb-2">Current Selection:</p>
              <div className="space-y-1 text-xs">
                <p className="text-gray-300">Haircut: <span className="text-white font-medium">{haircut}</span></p>
                <p className="text-gray-300">Color: <span className="text-white font-medium">{hairColor}</span></p>
                <p className="text-gray-300">Gender: <span className="text-white font-medium">{gender}</span></p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Simulation;
