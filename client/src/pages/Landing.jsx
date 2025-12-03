import { useState, useRef, useEffect } from 'react';
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
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [autoSlideDirection, setAutoSlideDirection] = useState(1);
  const sliderRef = useRef(null);
  const autoSlideRef = useRef(null);
  const interactionTimeoutRef = useRef(null);

  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll animation states
  const [visibleSections, setVisibleSections] = useState({});

  // Auto-slide animation for before/after slider
  useEffect(() => {
    if (isUserInteracting) {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
        autoSlideRef.current = null;
      }
      return;
    }

    // Start auto-slide after 2 seconds of no interaction
    interactionTimeoutRef.current = setTimeout(() => {
      autoSlideRef.current = setInterval(() => {
        setSliderPosition(prev => {
          let newPosition = prev + (autoSlideDirection * 0.3);

          if (newPosition >= 80) {
            setAutoSlideDirection(-1);
            return 80;
          }
          if (newPosition <= 20) {
            setAutoSlideDirection(1);
            return 20;
          }
          return newPosition;
        });
      }, 30);
    }, 2000);

    return () => {
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [isUserInteracting, autoSlideDirection]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Slider handlers
  const handleSliderMove = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleSliderMouseDown = () => {
    setIsUserInteracting(true);
    const handleMouseMove = (e) => handleSliderMove(e);
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setTimeout(() => setIsUserInteracting(false), 100);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSliderTouchStart = () => {
    setIsUserInteracting(true);
  };

  const handleSliderTouchMove = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleSliderTouchEnd = () => {
    setTimeout(() => setIsUserInteracting(false), 100);
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
      description: 'Take a selfie or upload a clear photo. Use your camera or choose from gallery.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      number: '02',
      title: 'Select Your Style',
      description: 'Browse 100+ hairstyles from trendy cuts to classic looks.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      number: '03',
      title: 'Choose Hair Color',
      description: 'Pick from 30+ colors - natural shades or bold experiments.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      number: '04',
      title: 'Generate & Save',
      description: 'AI generates your look in seconds. Save and download your favorites.',
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
      description: 'Advanced AI delivers photorealistic transformations'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Instant Results',
      description: 'Get your new look in just seconds'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Camera Support',
      description: 'Use webcam or phone camera directly'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: '100+ Styles',
      description: 'Huge library of trending hairstyles'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      title: 'Save & Download',
      description: 'Keep your favorite transformations'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Secure & Private',
      description: 'Your photos are never shared'
    }
  ];

  // Stats
  const stats = [
    { value: '50K+', label: 'Happy Users' },
    { value: '500K+', label: 'Transformations' },
    { value: '100+', label: 'Hairstyles' },
    { value: '4.9', label: 'Rating' }
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

  // Animated Button Component
  const AnimatedButton = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
    const baseClasses = 'relative overflow-hidden font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500/50';
    const variantClasses = variant === 'primary'
      ? `${isDark ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'} shadow-lg hover:shadow-purple-500/25`
      : `border-2 ${borderColorLight} ${textPrimary} hover:border-purple-500/50 hover:bg-purple-500/10`;

    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${variantClasses} ${className}`}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
        <div className="absolute inset-0 -translate-x-full hover:translate-x-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
      </button>
    );
  };

  return (
    <div className={`min-h-screen ${bgPrimary} ${textPrimary} transition-colors duration-300 overflow-x-hidden`}>
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(147, 51, 234, 0.3); }
          50% { box-shadow: 0 0 50px rgba(147, 51, 234, 0.5); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-fadeInLeft { animation: fadeInLeft 0.8s ease-out forwards; }
        .animate-fadeInRight { animation: fadeInRight 0.8s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.6s ease-out forwards; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .opacity-0 { opacity: 0; }
        .group:hover .group-hover-scale { transform: scale(1.1); }
        .group:hover .group-hover-rotate { transform: rotate(5deg); }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-lg border-b ${borderColor} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className={`w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">HairAI</span>
                <span className={`text-xs block ${textTertiary} -mt-1`}>Transform Your Look</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2.5 rounded-xl ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-all duration-300 hover:scale-110`}
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

              {isAuthenticated ? (
                <>
                  {/* Desktop Nav */}
                  <div className="hidden md:flex items-center space-x-3">
                    <button
                      onClick={() => navigate('/simulation')}
                      className={`${textSecondary} hover:text-purple-400 transition-colors px-3 py-2 text-sm font-medium`}
                    >
                      Simulation
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className={`${textSecondary} hover:text-purple-400 transition-colors px-3 py-2 text-sm font-medium`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/profile')}
                      className={`flex items-center gap-2 ${textSecondary} hover:text-purple-400 transition-colors px-3 py-2 text-sm font-medium`}
                    >
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      {user?.username}
                    </button>
                    <AnimatedButton onClick={() => navigate('/simulation')} className="px-5 py-2.5 rounded-xl text-sm">
                      Try Now
                    </AnimatedButton>
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
                </>
              ) : (
                <>
                  <button
                    onClick={openLoginModal}
                    className={`${textSecondary} hover:text-purple-400 transition-colors px-4 py-2 text-sm font-medium hidden sm:block`}
                  >
                    Sign In
                  </button>
                  <AnimatedButton onClick={openRegisterModal} className="px-5 py-2.5 rounded-xl text-sm">
                    Get Started
                  </AnimatedButton>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isAuthenticated && mobileMenuOpen && (
          <div className={`md:hidden ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-xl border-t px-4 py-3 space-y-2`}>
            <button
              onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
              className={`flex items-center gap-2 w-full text-left ${isDark ? 'text-white' : 'text-gray-900'} py-2 text-sm`}
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              {user?.username}
            </button>
            <button
              onClick={() => { navigate('/simulation'); setMobileMenuOpen(false); }}
              className={`block w-full text-left ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} py-2 text-sm`}
            >
              Simulation
            </button>
            <button
              onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
              className={`block w-full text-left ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} py-2 text-sm`}
            >
              Dashboard
            </button>
            <button
              onClick={() => { navigate('/simulation'); setMobileMenuOpen(false); }}
              className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2.5 rounded-xl text-sm text-center font-medium"
            >
              Try Now
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-pink-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 ${bgSecondary} rounded-full text-sm ${textSecondary} mb-8 border ${borderColor} animate-fadeInUp`}
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>AI-Powered Hair Simulation</span>
          </div>

          <h1
            className={`text-5xl md:text-7xl font-bold mb-6 ${textPrimary} animate-fadeInUp opacity-0`}
            style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
          >
            See Your New Look
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-gradient">
              Before You Commit
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl ${textSecondary} mb-10 max-w-2xl mx-auto animate-fadeInUp opacity-0`}
            style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
          >
            Upload your photo and instantly preview different hairstyles using advanced AI technology. Try before you dye!
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp opacity-0"
            style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
          >
            <AnimatedButton
              onClick={isAuthenticated ? () => navigate('/simulation') : openRegisterModal}
              className="px-8 py-4 rounded-xl text-lg w-full sm:w-auto"
            >
              {isAuthenticated ? 'Go to Simulation' : "Start Free"}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </AnimatedButton>
            <AnimatedButton
              onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              variant="secondary"
              className="px-8 py-4 rounded-xl text-lg w-full sm:w-auto"
            >
              See How It Works
            </AnimatedButton>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-8 px-4 ${bgSecondary} border-y ${borderColor}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                id={`stat-${index}`}
                data-animate
                className={`text-center py-4 ${visibleSections[`stat-${index}`] ? 'animate-scaleIn' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                  {stat.value}
                </div>
                <div className={`text-sm ${textSecondary} mt-1`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Comparison Section */}
      <section className={`py-24 px-4 ${bgPrimary}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Side */}
            <div
              id="comparison-text"
              data-animate
              className={`flex-1 text-center lg:text-left ${visibleSections['comparison-text'] ? 'animate-fadeInLeft' : 'opacity-0'}`}
            >
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${textPrimary}`}>
                See the{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                  Magic
                </span>
              </h2>
              <p className={`${textSecondary} mb-8 text-lg leading-relaxed`}>
                Experience the power of AI-driven hairstyle transformation. Our advanced technology
                seamlessly visualizes how different hairstyles would look on you.
              </p>

              <div className="space-y-4 mb-8">
                {['Realistic hair simulation', 'Multiple style options', 'Instant results in seconds'].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center lg:justify-start gap-4 group cursor-default"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className={`text-base ${textSecondary} group-hover:text-purple-400 transition-colors`}>{feature}</span>
                  </div>
                ))}
              </div>

              <p className={`text-sm ${textTertiary} flex items-center justify-center lg:justify-start gap-2`}>
                <svg className="w-4 h-4 animate-pulse text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Drag the slider or watch it animate
              </p>
            </div>

            {/* Right Side - Slider */}
            <div
              id="comparison-slider"
              data-animate
              className={`flex-1 w-full max-w-md ${visibleSections['comparison-slider'] ? 'animate-fadeInRight' : 'opacity-0'}`}
            >
              <div
                ref={sliderRef}
                className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden cursor-ew-resize select-none shadow-2xl animate-pulse-glow"
                onMouseDown={handleSliderMouseDown}
                onTouchStart={handleSliderTouchStart}
                onTouchMove={handleSliderTouchMove}
                onTouchEnd={handleSliderTouchEnd}
              >
                {/* After Image */}
                <div className="absolute inset-0">
                  <img src={imgAfter} alt="After" className="w-full h-full object-cover" />
                </div>

                {/* Before Image */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img src={imgBefore} alt="Before" className="w-full h-full object-cover" />
                </div>

                {/* Slider Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] cursor-ew-resize"
                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)', willChange: 'left' }}
                />

                {/* Labels */}
                <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-xl text-white text-sm font-medium">
                  Before
                </div>
                <div className="absolute bottom-4 right-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-sm font-medium">
                  After
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={`py-24 px-4 ${bgSecondary}`}>
        <div className="max-w-6xl mx-auto">
          <div
            id="how-it-works-header"
            data-animate
            className={`text-center mb-16 ${visibleSections['how-it-works-header'] ? 'animate-fadeInUp' : 'opacity-0'}`}
          >
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${textPrimary}`}>
              How It{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">Works</span>
            </h2>
            <p className={`${textSecondary} max-w-xl mx-auto text-lg`}>
              Transform your look in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                id={`step-${index}`}
                data-animate
                className={`${bgPrimary} border ${borderColor} rounded-2xl p-6 relative group hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10 ${visibleSections[`step-${index}`] ? 'animate-fadeInUp' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {step.number}
                </div>
                <div className={`w-16 h-16 ${bgTertiary} rounded-2xl flex items-center justify-center mb-5 mt-4 ${textPrimary} transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-purple-500/20 group-hover:to-pink-500/20`}>
                  {step.icon}
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${textPrimary}`}>{step.title}</h3>
                <p className={`${textSecondary} text-sm leading-relaxed`}>{step.description}</p>
              </div>
            ))}
          </div>

          <div
            id="how-cta"
            data-animate
            className={`text-center mt-16 ${visibleSections['how-cta'] ? 'animate-fadeInUp' : 'opacity-0'}`}
          >
            <AnimatedButton
              onClick={isAuthenticated ? () => navigate('/simulation') : openRegisterModal}
              className="px-10 py-4 rounded-xl text-lg"
            >
              {isAuthenticated ? 'Start Simulation' : 'Try It Free'}
            </AnimatedButton>
            <p className={`${textTertiary} text-sm mt-4`}>3 free generations. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-24 px-4 ${bgPrimary}`}>
        <div className="max-w-6xl mx-auto">
          <div
            id="features-header"
            data-animate
            className={`text-center mb-16 ${visibleSections['features-header'] ? 'animate-fadeInUp' : 'opacity-0'}`}
          >
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${textPrimary}`}>
              Why{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">HairAI</span>
            </h2>
            <p className={`${textSecondary} max-w-xl mx-auto text-lg`}>
              Everything you need for the perfect hair transformation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                id={`feature-${index}`}
                data-animate
                className={`${bgSecondary} border ${borderColor} rounded-2xl p-6 text-center group hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5 ${visibleSections[`feature-${index}`] ? 'animate-scaleIn' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 ${bgTertiary} rounded-2xl flex items-center justify-center mx-auto mb-5 ${textPrimary} transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-purple-500/20 group-hover:to-pink-500/20 group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>{feature.title}</h3>
                <p className={`${textSecondary} text-sm`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-24 px-4 ${bgSecondary} relative overflow-hidden`}>
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
        </div>

        <div
          id="cta-section"
          data-animate
          className={`max-w-3xl mx-auto text-center relative z-10 ${visibleSections['cta-section'] ? 'animate-fadeInUp' : 'opacity-0'}`}
        >
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${textPrimary}`}>
            Ready to{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">Transform?</span>
          </h2>
          <p className={`${textSecondary} mb-10 text-lg`}>
            Join thousands who discovered their perfect hairstyle. Start your transformation today!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AnimatedButton
              onClick={isAuthenticated ? () => navigate('/simulation') : openRegisterModal}
              className="px-10 py-4 rounded-xl text-lg w-full sm:w-auto"
            >
              {isAuthenticated ? 'Go to Simulation' : 'Create Free Account'}
            </AnimatedButton>
            {!isAuthenticated && (
              <AnimatedButton
                onClick={openLoginModal}
                variant="secondary"
                className="px-10 py-4 rounded-xl text-lg w-full sm:w-auto"
              >
                Sign In
              </AnimatedButton>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-4 border-t ${borderColor} ${bgPrimary}`}>
        <div className={`max-w-7xl mx-auto text-center ${textTertiary} text-sm`}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">HairAI</span>
          </div>
          <p>&copy; 2024 HairAI. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={openRegisterModal}
        onForgotPassword={handleForgotPassword}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={openLoginModal}
      />
    </div>
  );
};

export default Landing;
