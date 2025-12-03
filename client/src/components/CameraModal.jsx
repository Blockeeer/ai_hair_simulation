import { useState, useRef, useEffect, useCallback } from 'react';

const CameraModal = ({ isOpen, onClose, onCapture, isDark = true }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setIsReady(false);

    try {
      // Stop any existing stream first
      stopCamera();

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to be ready to play
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            // Wait a bit for the first frames to render
            setTimeout(() => {
              setIsLoading(false);
              setIsReady(true);
            }, 500);
          } catch (playError) {
            console.error('Video play error:', playError);
            setError('Failed to start video preview');
            setIsLoading(false);
          }
        };

        videoRef.current.onerror = () => {
          setError('Video stream error');
          setIsLoading(false);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setIsLoading(false);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported on this browser.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch camera when facingMode changes
  useEffect(() => {
    if (isOpen && !error) {
      startCamera();
    }
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = () => {
    if (!isReady) return;

    // Start countdown
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          captureImage();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video dimensions not available');
      setError('Camera not ready. Please try again.');
      setCountdown(null);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Handle mirror effect for front camera
    if (facingMode === 'user') {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Reset transformation
    if (facingMode === 'user') {
      context.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Get the image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.92);

    // Stop the camera
    stopCamera();

    // Pass the captured image to parent
    onCapture(imageData);
    onClose();
  };

  const handleInstantCapture = () => {
    if (!isReady) return;
    captureImage();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleClose = () => {
    stopCamera();
    setError('');
    setCountdown(null);
    onClose();
  };

  if (!isOpen) return null;

  const bgPrimary = isDark ? 'bg-black' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-800' : 'border-gray-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className={`relative ${bgPrimary} rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border ${borderColor}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${textPrimary}`}>Take a Photo</h3>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
          >
            <svg className={`w-5 h-5 ${textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera View */}
        <div className="relative aspect-[4/3] bg-black">
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent mx-auto mb-3"></div>
                <p className="text-white text-sm">Starting camera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center">
                <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            style={{ display: isLoading || error ? 'none' : 'block' }}
          />

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-8xl font-bold text-white animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {/* Face guide overlay */}
          {!isLoading && !error && countdown === null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-64 border-2 border-white/30 rounded-full"></div>
            </div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className={`p-4 border-t ${borderColor}`}>
          <div className="flex items-center justify-center gap-4">
            {/* Switch Camera */}
            <button
              onClick={switchCamera}
              disabled={!isReady || !!error || countdown !== null}
              className={`p-3 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Switch Camera"
            >
              <svg className={`w-6 h-6 ${textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Capture Button */}
            <button
              onClick={handleCapture}
              disabled={!isReady || !!error || countdown !== null}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              title="Take Photo (3s countdown)"
            >
              <div className="w-12 h-12 rounded-full bg-white"></div>
            </button>

            {/* Instant Capture */}
            <button
              onClick={handleInstantCapture}
              disabled={!isReady || !!error || countdown !== null}
              className={`p-3 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Instant Capture"
            >
              <svg className={`w-6 h-6 ${textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          <p className={`text-center text-xs ${textSecondary} mt-3`}>
            Center button: 3s countdown | Right button: Instant capture
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
