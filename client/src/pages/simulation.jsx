import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import api from '../utils/api';

const Simulation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [hairPrompt, setHairPrompt] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

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
    // Only accept images
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set square dimensions (1:1 aspect ratio) - 512x512
        const SIZE = 512;
        canvas.width = SIZE;
        canvas.height = SIZE;

        // Calculate scaling to cover the entire square (crop to fit)
        const scale = Math.max(SIZE / img.width, SIZE / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center the image in the square canvas (crop edges if needed)
        const x = (SIZE - scaledWidth) / 2;
        const y = (SIZE - scaledHeight) / 2;

        // Draw image to fill entire square (will crop if aspect ratio doesn't match)
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        // 100% quality - no compression
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
    setHairPrompt('');
    setError('');
  };

  const handleApplyChanges = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    if (!hairPrompt.trim()) {
      setError('Please describe your desired hairstyle');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await api.post('/simulation/generate', {
        imageBase64: uploadedImage,
        haircutDescription: hairPrompt
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-purple-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>
            <div className="h-8 w-px bg-white opacity-30"></div>
            <h1 className="text-2xl font-bold text-white">AI Hair Simulation</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-73px)] flex">
        {/* Controls Panel */}
        <aside className="w-96 bg-white shadow-md p-6 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-6">Simulation Controls</h2>

          <div className="space-y-6">
            {/* Hair Design Prompt */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Design Your Hairstyle</h3>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Describe your desired hairstyle</label>
                <textarea
                  value={hairPrompt}
                  onChange={(e) => setHairPrompt(e.target.value)}
                  placeholder="Example: Wolf cut with long length and curly style, or Short pixie cut with blonde highlights, or Medium bob with side-swept bangs..."
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific about the style, length, texture, color, and any other details you want.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                  {error}
                </div>
              )}
              <Button
                className="w-full"
                variant="primary"
                onClick={handleApplyChanges}
                disabled={!uploadedImage || isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Simulation'}
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={handleReset}
              >
                Reset to Default
              </Button>
              <Button className="w-full" variant="outline">
                Save Simulation
              </Button>
            </div>
          </div>
        </aside>

        {/* 3D Canvas Area with Drag & Drop */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-100 to-gray-200">
          <div
            className={`flex-1 flex items-center justify-center p-8 transition-colors ${
              isDragging ? 'bg-purple-100' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!uploadedImage ? (
              <div className="text-center max-w-md">
                <div className="text-8xl mb-6">📸</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                  Upload Your Photo
                </h3>
                <p className="text-gray-500 mb-6">
                  Drag and drop your image here, or click to browse
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-purple-500 transition-colors cursor-pointer">
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
                      className="w-16 h-16 text-gray-400 mb-4"
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
                    <span className="text-purple-600 font-medium">Click to upload</span>
                    <span className="text-gray-500 text-sm mt-2">PNG, JPG up to 10MB</span>
                  </label>
                </div>
              </div>
            ) : !resultImage ? (
              <div className="relative">
                {/* Before Image - Smaller container */}
                <div className="w-[280px] h-[280px] bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-800 relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
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
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white mx-auto mb-3"></div>
                        <p className="text-sm font-semibold">Generating...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 bg-white px-6 py-3 rounded-lg shadow-md max-w-[280px]">
                  <p className="text-sm text-gray-600 text-center">
                    ✓ Image uploaded! Configure settings and generate simulation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-8 items-center">
                {/* Before Image */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Before</h3>
                  <div className="w-[320px] h-[570px] bg-white rounded-3xl shadow-xl overflow-hidden border-6 border-gray-700 relative">
                    <img
                      src={uploadedImage}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-5xl text-purple-600">→</div>

                {/* After Image */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">After</h3>
                  <div className="w-[320px] h-[570px] bg-white rounded-3xl shadow-xl overflow-hidden border-6 border-purple-600 relative">
                    <img
                      src={resultImage}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      New Look ✨
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Another
                </button>
              </div>
            )}
              </div>
        </div>
      </main>
    </div>
  );
};

export default Simulation;
