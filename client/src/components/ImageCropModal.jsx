import { useState, useRef, useEffect, useCallback } from 'react';

const ImageCropModal = ({ imageUrl, onCrop, onCancel, cropSize = 512 }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [minScale, setMinScale] = useState(1);

  // Load the image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);

      // Calculate minimum scale to ensure image covers the crop area
      const scaleX = cropSize / img.width;
      const scaleY = cropSize / img.height;
      const initialScale = Math.max(scaleX, scaleY);

      setMinScale(initialScale);
      setScale(initialScale);

      // Center the image
      setPosition({
        x: (cropSize - img.width * initialScale) / 2,
        y: (cropSize - img.height * initialScale) / 2
      });
    };
    img.src = imageUrl;
  }, [imageUrl, cropSize]);

  // Draw the image on canvas
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, cropSize, cropSize);

    // Draw image
    ctx.drawImage(
      image,
      position.x,
      position.y,
      image.width * scale,
      image.height * scale
    );
  }, [image, position, scale, cropSize]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Constrain position to keep image covering crop area
  const constrainPosition = (newX, newY, newScale) => {
    const scaledWidth = image.width * newScale;
    const scaledHeight = image.height * newScale;

    // Max position (image can't go past left/top edge of crop area)
    const maxX = 0;
    const maxY = 0;

    // Min position (image can't reveal right/bottom edge)
    const minX = cropSize - scaledWidth;
    const minY = cropSize - scaledHeight;

    return {
      x: Math.min(maxX, Math.max(minX, newX)),
      y: Math.min(maxY, Math.max(minY, newY))
    };
  };

  // Handle mouse/touch drag
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !image) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;

    const constrained = constrainPosition(newX, newY, scale);
    setPosition(constrained);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleZoom = (newScale) => {
    if (!image) return;

    const clampedScale = Math.max(minScale, Math.min(3, newScale));

    // Zoom toward center
    const centerX = cropSize / 2;
    const centerY = cropSize / 2;

    // Calculate the point on the image that's at the center
    const imgCenterX = (centerX - position.x) / scale;
    const imgCenterY = (centerY - position.y) / scale;

    // Calculate new position to keep that point centered
    const newX = centerX - imgCenterX * clampedScale;
    const newY = centerY - imgCenterY * clampedScale;

    const constrained = constrainPosition(newX, newY, clampedScale);

    setScale(clampedScale);
    setPosition(constrained);
  };

  // Handle wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(scale + delta);
  };

  // Handle crop confirmation
  const handleCrop = () => {
    if (!canvasRef.current) return;

    // Create output canvas at exact crop size
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = cropSize;
    outputCanvas.height = cropSize;
    const outputCtx = outputCanvas.getContext('2d');

    // Draw the current view
    outputCtx.drawImage(
      image,
      position.x,
      position.y,
      image.width * scale,
      image.height * scale
    );

    // Get the cropped image as base64
    const croppedImage = outputCanvas.toDataURL('image/jpeg', 1.0);
    onCrop(croppedImage);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="text-white font-medium">Crop Image</h3>
            <p className="text-gray-400 text-sm">Position your face in the frame</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Crop Area */}
        <div className="p-4">
          <div
            ref={containerRef}
            className="relative mx-auto bg-gray-800 rounded-lg overflow-hidden cursor-move"
            style={{ width: '100%', maxWidth: cropSize, aspectRatio: '1/1' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              width={cropSize}
              height={cropSize}
              className="w-full h-full"
              style={{ touchAction: 'none' }}
            />

            {/* Crop overlay guide */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner guides */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white opacity-50"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white opacity-50"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white opacity-50"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white opacity-50"></div>

              {/* Center crosshair */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-6 h-px bg-white opacity-30"></div>
                <div className="w-px h-6 bg-white opacity-30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => handleZoom(scale - 0.1)}
              disabled={scale <= minScale}
              className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <div className="flex-1">
              <input
                type="range"
                min={minScale * 100}
                max={300}
                value={scale * 100}
                onChange={(e) => handleZoom(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            <button
              onClick={() => handleZoom(scale + 0.1)}
              disabled={scale >= 3}
              className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <span className="text-gray-400 text-sm w-16 text-right">{Math.round(scale * 100)}%</span>
          </div>

          {/* Instructions */}
          <p className="text-gray-500 text-xs text-center mt-3">
            Drag to position | Scroll or use slider to zoom
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 bg-white hover:bg-gray-200 text-black py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
