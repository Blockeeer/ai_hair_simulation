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

  // Replicate options
  const [haircut, setHaircut] = useState('Random');
  const [hairColor, setHairColor] = useState('Random');
  const [gender, setGender] = useState('Auto-detect');

  // Options from Replicate playground
  const haircutOptions = [
    'Random',
    'Afro',
    'Bob',
    'Bowl cut',
    'Braids',
    'Bun',
    'Buzz cut',
    'Cornrows',
    'Crew cut',
    'Curly',
    'Dreadlocks',
    'Fade',
    'Long hair',
    'Mohawk',
    'Mullet',
    'Pixie cut',
    'Pompadour',
    'Ponytail',
    'Short hair',
    'Side part',
    'Straight hair',
    'Undercut',
    'Wavy hair',
    'Wolf cut'
  ];

  const hairColorOptions = [
    'Random',
    'Black',
    'Blonde',
    'Brown',
    'Red',
    'Gray',
    'White',
    'Blue',
    'Green',
    'Pink',
    'Purple'
  ];

  const genderOptions = [
    'Auto-detect',
    'Male',
    'Female'
  ];

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
      {/* Simple Black Navbar */}
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">AI Hair Simulation</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Dashboard
            </button>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400 text-sm">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-65px)] flex">
        {/* Left Panel - Controls */}
        <aside className="w-80 bg-black border-r border-gray-800 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-6">Settings</h2>

          <div className="space-y-5">
            {/* Haircut Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Haircut
              </label>
              <select
                value={haircut}
                onChange={(e) => setHaircut(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-gray-600 text-sm"
              >
                {haircutOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Hair Color Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hair Color
              </label>
              <select
                value={hairColor}
                onChange={(e) => setHairColor(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-gray-600 text-sm"
              >
                {hairColorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-gray-600 text-sm"
              >
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-px bg-gray-800 my-6"></div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {error && (
                <div className="bg-red-900 bg-opacity-30 border border-red-800 text-red-300 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!uploadedImage || isGenerating}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
                  !uploadedImage || isGenerating
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={handleReset}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium text-sm transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Current Selection Info */}
            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 mb-2">Current Selection:</p>
              <div className="space-y-1 text-xs">
                <p className="text-gray-300">Haircut: <span className="text-white font-medium">{haircut}</span></p>
                <p className="text-gray-300">Color: <span className="text-white font-medium">{hairColor}</span></p>
                <p className="text-gray-300">Gender: <span className="text-white font-medium">{gender}</span></p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Panel - Canvas/Display */}
        <div
          className="flex-1 flex items-center justify-center bg-black"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!uploadedImage ? (
            <div className="text-center max-w-md">
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-12 hover:border-gray-600 transition-colors">
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
                    className="w-16 h-16 text-gray-600 mb-4"
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
                  <span className="text-white font-medium mb-2">Drop image or click to upload</span>
                  <span className="text-gray-500 text-sm">PNG, JPG up to 10MB</span>
                </label>
              </div>
            </div>
          ) : !resultImage ? (
            <div className="relative">
              <div className="w-[400px] h-[400px] bg-gray-900 rounded-lg overflow-hidden border border-gray-800 relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                  title="Remove image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                {isGenerating && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-3"></div>
                      <p className="text-sm">Generating...</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-center mt-4 text-sm">
                Image ready. Configure settings and generate.
              </p>
            </div>
          ) : (
            <div className="flex gap-8 items-center relative">
              {/* Before Image */}
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">Before</p>
                <div className="w-[350px] h-[350px] bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                  <img
                    src={uploadedImage}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="text-4xl text-gray-600">→</div>

              {/* After Image */}
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">After</p>
                <div className="w-[350px] h-[350px] bg-gray-900 rounded-lg overflow-hidden border border-white">
                  <img
                    src={resultImage}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Try Another Button */}
              <button
                onClick={handleRemoveImage}
                className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors text-sm"
              >
                Try Another Image
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Simulation;
