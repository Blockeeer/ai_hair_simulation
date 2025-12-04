import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            onClick={() => navigate('/simulation')}
            className={navLinkClass('/simulation')}
          >
            Simulation
          </button>
          <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
          <button
            onClick={() => navigate('/dashboard')}
            className={navLinkClass('/dashboard')}
          >
            Dashboard
          </button>
          <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
          <button
            onClick={() => navigate('/profile')}
            className={`flex items-center gap-2 ${navLinkClass('/profile')}`}
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt=""
                className="w-6 h-6 rounded-full object-cover ring-2 ring-purple-500/50"
              />
            ) : (
              <div className={`w-6 h-6 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            {user?.username}
          </button>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg transition-all text-sm hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
          >
            Logout
          </button>
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
          <button
            onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-2 w-full text-left ${isDark ? 'text-white' : 'text-gray-900'} py-2 text-sm`}
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt=""
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            {user?.username}
          </button>
          <button
            onClick={() => { navigate('/simulation'); setMobileMenuOpen(false); }}
            className={mobileNavLinkClass('/simulation')}
          >
            Simulation
          </button>
          <button
            onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
            className={mobileNavLinkClass('/dashboard')}
          >
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2.5 rounded-xl text-sm text-center font-medium mt-2"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
