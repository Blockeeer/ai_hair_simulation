import { useState, useRef, useCallback, useEffect } from 'react';

const ImageCompareSlider = ({ beforeImage, afterImage, beforeLabel = 'Before', afterLabel = 'After' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const sliderRef = useRef(null);
  const beforeClipRef = useRef(null);

  const updateSliderPosition = useCallback((percentage) => {
    // Direct DOM manipulation for instant response
    if (sliderRef.current) {
      sliderRef.current.style.left = `${percentage}%`;
    }
    if (beforeClipRef.current) {
      beforeClipRef.current.style.width = `${percentage}%`;
    }
    setSliderPosition(percentage);
  }, []);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    updateSliderPosition(percentage);
  }, [updateSliderPosition]);

  // Use document-level mouse events for smoother tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      handleMove(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMove]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square select-none cursor-ew-resize overflow-hidden rounded-lg border border-gray-700"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* After Image (Background) */}
      <div className="absolute inset-0">
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* After Label */}
        <span className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded font-medium">
          {afterLabel}
        </span>
      </div>

      {/* Before Image (Clipped) */}
      <div
        ref={beforeClipRef}
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
            maxWidth: 'none'
          }}
          draggable={false}
        />
        {/* Before Label */}
        <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {beforeLabel}
        </span>
      </div>

      {/* Slider Handle */}
      <div
        ref={sliderRef}
        className="absolute top-0 bottom-0 w-1 bg-white/80 pointer-events-none"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-purple-500 gap-0.5">
          <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Instructions overlay (shows briefly) */}
      {sliderPosition === 50 && !isDragging && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none animate-pulse">
          Drag to compare
        </div>
      )}
    </div>
  );
};

export default ImageCompareSlider;
