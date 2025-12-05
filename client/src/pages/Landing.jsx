import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import api from '../utils/api';
import creditsIcon from '../assets/credits.png';

// Import before/after images
import imgBefore from '../assets/img_before.jpg';
import imgAfter from '../assets/img_after.png';

const Landing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Profile dropdown state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Credits state
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [creditPackages, setCreditPackages] = useState([]);
  const [credits, setCredits] = useState({ credits: 0, remaining: 0, limit: 3 });

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch credits when authenticated
  useEffect(() => {
    const fetchCredits = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const response = await api.get('/subscription/status');
        if (response.data.success) {
          setCredits({
            credits: response.data.data.credits,
            remaining: response.data.data.generationsRemaining,
            limit: response.data.data.freeLimit
          });
        }
      } catch (err) {
        console.error('Failed to fetch credits:', err);
      }
    };
    fetchCredits();
  }, [isAuthenticated, user]);

  // Fetch credit packages
  useEffect(() => {
    const fetchPackages = async () => {
      if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  const handlePurchase = async (packageId) => {
    try {
      const response = await api.post('/payment/create-checkout-session', { packageId });
      if (response.data.success && response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Payment error:', err);
    }
  };

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    logout();
    navigate('/');
  };

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

  // Navigation handlers
  const goToSimulation = () => {
    navigate('/simulation');
  };

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Main CTA button handler
  const handleMainCTA = () => {
    if (isAuthenticated) {
      navigate('/simulation');
    } else {
      openRegisterModal();
    }
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

  // Button styles matching navbar Get Started button exactly
  const primaryButtonClass = "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25";
  const secondaryButtonClass = `border-2 ${borderColorLight} ${textPrimary} rounded-lg transition-all hover:scale-105 hover:border-purple-500/50 hover:bg-purple-500/10`;

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
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 1 !important;
        }
        .animate-fadeInLeft {
          animation: fadeInLeft 0.8s ease-out forwards;
          opacity: 1 !important;
        }
        .animate-fadeInRight {
          animation: fadeInRight 0.8s ease-out forwards;
          opacity: 1 !important;
        }
        .animate-scaleIn {
          animation: scaleIn 0.6s ease-out forwards;
          opacity: 1 !important;
        }
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
        .group:hover .group-hover-scale { transform: scale(1.1); }
        .group:hover .group-hover-rotate { transform: rotate(5deg); }
      `}</style>

      {/* Navigation - Matching shared Navbar styling */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-950/80' : 'bg-white/80'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          {/* Logo - Same as shared Navbar */}
          <h1
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
          >
            AI Hair Simulation
          </h1>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}
                >
                  Dashboard
                </button>
                <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
                <button
                  onClick={() => navigate('/simulation')}
                  className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}
                >
                  Simulation
                </button>
                <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>

                {/* Credits Indicator */}
                <button
                  onClick={() => setShowPricingModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    isDark
                      ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400'
                      : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600'
                  }`}
                  title="Buy Credits"
                >
                  <img src={creditsIcon} alt="credits" className="w-4 h-4" />
                  <span className="text-sm font-medium">{credits.credits}</span>
                  {credits.remaining > 0 && (
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      +{credits.remaining} free
                    </span>
                  )}
                </button>

                <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className={`flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}
                  >
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/50"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                        <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    {user?.username}
                    <svg className={`w-4 h-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border shadow-xl py-2 z-50`}>
                      {/* User Info */}
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>{user?.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        {/* Profile Settings */}
                        <button
                          onClick={() => { navigate('/profile'); setProfileDropdownOpen(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Profile Settings
                        </button>

                        {/* Theme Toggle */}
                        <button
                          onClick={() => { toggleTheme(); }}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                        >
                          {isDark ? (
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                          )}
                          {isDark ? 'Light Mode' : 'Dark Mode'}
                        </button>
                      </div>

                      {/* Logout */}
                      <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-1 mt-1`}>
                        <button
                          onClick={handleLogout}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-red-500 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Theme Toggle - First (utility) */}
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDark ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
                {/* Sign In - Secondary action */}
                <button
                  onClick={openLoginModal}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  Sign In
                </button>
                {/* Get Started - Primary CTA (last/rightmost) */}
                <button
                  onClick={openRegisterModal}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25"
                >
                  Get Started
                </button>
              </>
            )}
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
          <div className={`md:hidden ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-xl border-t px-4 py-3 space-y-2`}>
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className={`flex items-center gap-3 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-2`}>
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/50" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                      <svg className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                  </div>
                </div>

                {/* Navigation Links */}
                <button
                  onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
                  className={`block w-full text-left ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} py-2 text-sm`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { navigate('/simulation'); setMobileMenuOpen(false); }}
                  className={`block w-full text-left ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} py-2 text-sm`}
                >
                  Simulation
                </button>

                {/* Credits - Mobile */}
                <button
                  onClick={() => { setShowPricingModal(true); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-between w-full py-2.5 px-3 rounded-lg ${
                    isDark
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-yellow-50 text-yellow-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={creditsIcon} alt="credits" className="w-5 h-5" />
                    <span className="text-sm font-medium">Credits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{credits.credits}</span>
                    {credits.remaining > 0 && (
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        +{credits.remaining} free
                      </span>
                    )}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>

                {/* Divider */}
                <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} my-2`}></div>

                {/* Profile Settings */}
                <button
                  onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 w-full text-left py-2 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Profile Settings
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`flex items-center gap-3 w-full text-left py-2 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {isDark ? (
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>

                {/* Divider */}
                <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} my-2`}></div>

                {/* Sign Out */}
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full text-left py-2 text-sm text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-3">
                {/* Theme Toggle Mobile - First */}
                <button
                  onClick={toggleTheme}
                  className={`flex items-center gap-3 w-full py-2.5 px-3 rounded-lg text-sm ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {isDark ? (
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>

                {/* Divider */}
                <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}></div>

                {/* Sign In - Secondary */}
                <button
                  onClick={() => { openLoginModal(); setMobileMenuOpen(false); }}
                  className={`block w-full py-2.5 px-3 rounded-lg text-sm font-medium text-center ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Sign In
                </button>

                {/* Get Started - Primary CTA */}
                <button
                  onClick={() => { openRegisterModal(); setMobileMenuOpen(false); }}
                  className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-3 rounded-lg text-sm text-center font-medium hover:shadow-lg hover:shadow-purple-500/25"
                >
                  Get Started
                </button>
              </div>
            )}
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
            className={`text-5xl md:text-7xl font-bold mb-6 ${textPrimary} animate-fadeInUp`}
            style={{ animationDelay: '0.1s' }}
          >
            See Your New Look
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-gradient">
              Before You Commit
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl ${textSecondary} mb-10 max-w-2xl mx-auto animate-fadeInUp`}
            style={{ animationDelay: '0.2s' }}
          >
            Upload your photo and instantly preview different hairstyles using advanced AI technology. Try before you dye!
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp"
            style={{ animationDelay: '0.3s' }}
          >
            <button
              onClick={handleMainCTA}
              className={`${primaryButtonClass} px-8 py-4 text-lg w-full sm:w-auto font-medium flex items-center justify-center gap-2`}
            >
              {isAuthenticated ? 'Go to Simulation' : "Start Free"}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={scrollToHowItWorks}
              className={`${secondaryButtonClass} px-8 py-4 text-lg w-full sm:w-auto font-medium`}
            >
              See How It Works
            </button>
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
            className={`text-center mt-16 ${visibleSections['how-cta'] ? 'animate-fadeInUp' : ''}`}
          >
            <button
              onClick={handleMainCTA}
              className={`${primaryButtonClass} px-10 py-4 text-lg font-medium`}
            >
              {isAuthenticated ? 'Start Simulation' : 'Try It Free'}
            </button>
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
          className={`max-w-3xl mx-auto text-center relative z-10 ${visibleSections['cta-section'] ? 'animate-fadeInUp' : ''}`}
        >
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${textPrimary}`}>
            Ready to{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">Transform?</span>
          </h2>
          <p className={`${textSecondary} mb-10 text-lg`}>
            Join thousands who discovered their perfect hairstyle. Start your transformation today!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleMainCTA}
              className={`${primaryButtonClass} px-10 py-4 text-lg w-full sm:w-auto font-medium`}
            >
              {isAuthenticated ? 'Go to Simulation' : 'Create Free Account'}
            </button>
            {!isAuthenticated && (
              <button
                onClick={openLoginModal}
                className={`${secondaryButtonClass} px-10 py-4 text-lg w-full sm:w-auto font-medium`}
              >
                Sign In
              </button>
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

      {/* Credit Packages Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
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
                    {credits.credits}
                  </span>
                  {credits.remaining > 0 && (
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>+{credits.remaining} free</span>
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
    </div>
  );
};

export default Landing;
