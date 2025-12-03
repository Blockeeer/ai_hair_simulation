import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

// Import before/after images
import imgBefore from '../assets/img_before.jpg';
import imgAfter from '../assets/img_after.png';

const Landing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Theme state
  const [isDark, setIsDark] = useState(true);

  // Before/After slider state
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef(null);

  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

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

  // How it works steps
  const steps = [
    {
      number: '01',
      title: 'Upload Your Photo',
      description: 'Take a selfie or upload a clear photo of yourself. Make sure your face is clearly visible for best results.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      number: '02',
      title: 'Select Your Style',
      description: 'Browse through our collection of hairstyles. Choose from trendy cuts, classic looks, or bold new styles.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      number: '03',
      title: 'Choose Hair Color',
      description: 'Pick a hair color that complements your skin tone. Try natural shades or experiment with bold colors.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      number: '04',
      title: 'Generate & Preview',
      description: 'Our AI will generate your new look in seconds. Preview, save, or download your transformed image.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    }
  ];

  // Features
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

              {/* Show different buttons based on auth status */}
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/simulation')}
                  className={`${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} px-4 py-2 rounded-lg font-medium text-sm transition-colors`}
                >
                  Go to Simulation
                </button>
              ) : (
                <>
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
                </>
              )}
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
            <button
              onClick={openRegisterModal}
              className={`${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} px-6 py-3 rounded-lg font-medium transition-colors`}
            >
              Start Now - It's Free
            </button>
            <a
              href="#how-it-works"
              className={`border ${borderColorLight} ${textPrimary} px-6 py-3 rounded-lg font-medium hover:${bgSecondary} transition-colors`}
            >
              See How It Works
            </a>
          </div>
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

      {/* How It Works Section */}
      <section id="how-it-works" className={`py-16 px-4 ${bgPrimary}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${textPrimary}`}>How It Works</h2>
            <p className={`${textSecondary} max-w-xl mx-auto`}>
              Transform your look in just 4 simple steps. Our AI makes it easy to visualize your new hairstyle.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`${bgSecondary} border ${borderColor} rounded-xl p-6 relative hover:border-gray-600 transition-colors`}
              >
                <div className={`absolute -top-3 -left-3 w-10 h-10 ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'} rounded-full flex items-center justify-center text-sm font-bold`}>
                  {step.number}
                </div>
                <div className={`w-14 h-14 ${bgTertiary} rounded-xl flex items-center justify-center mb-4 mt-2 ${textPrimary}`}>
                  {step.icon}
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>{step.title}</h3>
                <p className={`${textSecondary} text-sm`}>{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={openRegisterModal}
              className={`${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} px-8 py-3 rounded-lg font-medium transition-colors text-lg`}
            >
              Try It Now
            </button>
            <p className={`${textTertiary} text-sm mt-3`}>
              Free to start. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 px-4 ${bgSecondary}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-2xl font-bold text-center mb-10 ${textPrimary}`}>Why Choose HairAI</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${bgPrimary} border ${borderColor} rounded-xl p-6 text-center hover:border-gray-600 transition-colors`}
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

      {/* CTA Section */}
      <section className={`py-16 px-4 ${bgPrimary}`}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${textPrimary}`}>Ready to Transform Your Look?</h2>
          <p className={`${textSecondary} mb-6`}>
            Join thousands of users who have discovered their perfect hairstyle. Sign up now and start experimenting with new looks!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={openRegisterModal}
              className={`${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} px-6 py-3 rounded-lg font-medium transition-colors`}
            >
              Create Free Account
            </button>
            <button
              onClick={openLoginModal}
              className={`border ${borderColorLight} ${textPrimary} px-6 py-3 rounded-lg font-medium hover:${bgSecondary} transition-colors`}
            >
              I Already Have an Account
            </button>
          </div>
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
