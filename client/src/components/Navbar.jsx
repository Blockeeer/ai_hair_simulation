import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import creditsIcon from '../assets/credits.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [creditPackages, setCreditPackages] = useState([]);
  const [credits, setCredits] = useState({ credits: 0, remaining: 0, limit: 3 });
  const dropdownRef = useRef(null);

  const currentPath = location.pathname;

  // Fetch credits on mount and when user changes
  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
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

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    logout();
    navigate('/');
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

  const isActive = (path) => currentPath === path;

  const navLinkClass = (path) => {
    if (isActive(path)) {
      return 'text-purple-500 font-medium transition-colors text-sm';
    }
    return `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`;
  };

  const mobileNavLinkClass = (path) => {
    if (isActive(path)) {
      return 'block w-full text-left text-purple-500 font-medium py-2 text-sm';
    }
    return `block w-full text-left ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} py-2 text-sm`;
  };

  return (
    <>
    <header className={`${isDark ? 'bg-gray-950/80 backdrop-blur-xl border-gray-800' : 'bg-white/80 backdrop-blur-xl border-gray-200'} border-b sticky top-0 z-50 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
        {/* Logo */}
        <h1
          onClick={() => navigate('/landing')}
          className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
        >
          AI Hair Simulation
        </h1>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={navLinkClass('/dashboard')}
          >
            Dashboard
          </button>
          <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
          <button
            onClick={() => navigate('/simulation')}
            className={navLinkClass('/simulation')}
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
        <div className={`md:hidden ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-xl border-t px-4 py-3 space-y-1`}>
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
            className={mobileNavLinkClass('/dashboard')}
          >
            Dashboard
          </button>
          <button
            onClick={() => { navigate('/simulation'); setMobileMenuOpen(false); }}
            className={mobileNavLinkClass('/simulation')}
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
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-left py-2 text-sm text-red-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}

    </header>

    {/* Credit Packages Modal - Outside header for proper positioning */}
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
    </>
  );
};

export default Navbar;
