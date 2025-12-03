import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ImageCompareSlider from '../components/ImageCompareSlider';
import api from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalSimulations: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    haircut: 'all',
    hairColor: 'all',
    gender: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Tab state: 'all' or 'favorites'
  const [activeTab, setActiveTab] = useState('all');

  // Modal view mode: 'slider' or 'sideBySide'
  const [modalViewMode, setModalViewMode] = useState('slider');

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchHistory(1);
    fetchStats();
  }, []);

  const fetchHistory = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/history?page=${page}&limit=${pagination.limit}`);
      if (response.data.success) {
        setHistory(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchHistory(newPage);
    // Scroll to top of history section
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/history/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const haircuts = [...new Set(history.map(item => item.haircut))].sort();
    const hairColors = [...new Set(history.map(item => item.hairColor))].sort();
    const genders = [...new Set(history.map(item => item.gender || 'none'))].sort();
    return { haircuts, hairColors, genders };
  }, [history]);

  // Apply filters and search to history
  const filteredHistory = useMemo(() => {
    let items = history;

    // Filter by tab first
    if (activeTab === 'favorites') {
      items = items.filter(item => item.isFavorite);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item => {
        // Search in haircut name
        if (item.haircut?.toLowerCase().includes(query)) return true;
        // Search in hair color
        if (item.hairColor?.toLowerCase().includes(query)) return true;
        // Search in date (formatted)
        const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).toLowerCase();
        if (dateStr.includes(query)) return true;
        // Search in gender
        const genderStr = item.gender === 'none' ? 'auto' : item.gender || 'auto';
        if (genderStr.toLowerCase().includes(query)) return true;
        return false;
      });
    }

    // Then apply dropdown filters
    return items.filter(item => {
      if (filters.haircut !== 'all' && item.haircut !== filters.haircut) return false;
      if (filters.hairColor !== 'all' && item.hairColor !== filters.hairColor) return false;
      if (filters.gender !== 'all' && (item.gender || 'none') !== filters.gender) return false;
      return true;
    });
  }, [history, filters, activeTab, searchQuery]);

  // Count favorites
  const favoritesCount = useMemo(() => {
    return history.filter(item => item.isFavorite).length;
  }, [history]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this simulation?')) return;

    try {
      await api.delete(`/history/${id}`);
      setSelectedImage(null);
      // Refresh current page (or go to previous if this was the last item on the page)
      const newTotal = pagination.total - 1;
      const newTotalPages = Math.ceil(newTotal / pagination.limit);
      const targetPage = pagination.page > newTotalPages ? Math.max(1, newTotalPages) : pagination.page;
      fetchHistory(targetPage);
      fetchStats();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedItems.size} simulation(s)?`)) return;

    setIsDeleting(true);
    try {
      // Delete items one by one
      const deletePromises = Array.from(selectedItems).map(id =>
        api.delete(`/history/${id}`)
      );

      await Promise.all(deletePromises);

      // Refresh current page (or go to previous if needed)
      const newTotal = pagination.total - selectedItems.size;
      const newTotalPages = Math.ceil(newTotal / pagination.limit);
      const targetPage = pagination.page > newTotalPages ? Math.max(1, newTotalPages) : pagination.page;

      setSelectedItems(new Set());
      setSelectMode(false);
      fetchHistory(targetPage);
      fetchStats();
    } catch (error) {
      console.error('Failed to delete some items:', error);
      // Refresh to get accurate state
      fetchHistory(pagination.page);
      fetchStats();
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleItemSelection = (id, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map(item => item.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedItems(new Set());
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatGender = (gender) => {
    if (!gender || gender === 'none') return 'Auto';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const clearFilters = () => {
    setFilters({ haircut: 'all', hairColor: 'all', gender: 'all' });
    setSearchQuery('');
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all').length;
  const hasActiveSearch = searchQuery.trim().length > 0;

  const handleDownload = async (imageUrl, type = 'result') => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `hair-simulation-${type}-${timestamp}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download image');
    }
  };

  const handleToggleFavorite = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const response = await api.put(`/history/${id}/favorite`);
      if (response.data.success) {
        // Update local state
        setHistory(history.map(item =>
          item.id === id ? { ...item, isFavorite: response.data.data.isFavorite } : item
        ));
        // Update selected image if open
        if (selectedImage && selectedImage.id === id) {
          setSelectedImage(prev => ({ ...prev, isFavorite: response.data.data.isFavorite }));
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleFavorite(selectedImage.id)}
                  className="text-yellow-400 hover:scale-110 transition-transform"
                  title={selectedImage.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {selectedImage.isFavorite ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                </button>
                <div>
                  <h3 className="text-white font-medium">{selectedImage.haircut} - {selectedImage.hairColor}</h3>
                  <p className="text-gray-400 text-sm">{formatDate(selectedImage.createdAt)} | {formatGender(selectedImage.gender)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {/* View Mode Toggle */}
              {!selectedImage.resultImageError && (
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-800 rounded-lg p-1 flex gap-1">
                    <button
                      onClick={() => setModalViewMode('slider')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        modalViewMode === 'slider'
                          ? 'bg-white text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                      Slider
                    </button>
                    <button
                      onClick={() => setModalViewMode('sideBySide')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        modalViewMode === 'sideBySide'
                          ? 'bg-white text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                      Side by Side
                    </button>
                  </div>
                </div>
              )}

              {/* Slider View */}
              {modalViewMode === 'slider' && !selectedImage.resultImageError ? (
                <div className="flex justify-center">
                  <div className="w-full max-w-[400px]">
                    <ImageCompareSlider
                      beforeImage={selectedImage.originalImage}
                      afterImage={selectedImage.resultImage}
                    />
                  </div>
                </div>
              ) : (
                /* Side by Side View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Before</p>
                    <img
                      src={selectedImage.originalImage}
                      alt="Before"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">After</p>
                    {selectedImage.resultImageError ? (
                      <div className="w-full aspect-square rounded-lg border-2 border-gray-700 bg-gray-800 flex flex-col items-center justify-center text-center p-4">
                        <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-400 text-sm">Image expired</p>
                        <p className="text-gray-500 text-xs mt-1">This simulation was saved before the fix</p>
                      </div>
                    ) : (
                      <img
                        src={selectedImage.resultImage}
                        alt="After"
                        className="w-full rounded-lg border-2 border-white"
                        onError={() => {
                          setSelectedImage(prev => ({ ...prev, resultImageError: true }));
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              <div className="mt-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedImage.originalImage, 'before')}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Before
                  </button>
                  {!selectedImage.resultImageError && (
                    <button
                      onClick={() => handleDownload(selectedImage.resultImage, 'after')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      After
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(selectedImage.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Navbar */}
      <header className={`${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-40 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <h1 className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Hair Simulation</h1>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate('/simulation')}
              className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}
            >
              Simulation
            </button>
            <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
            <button
              onClick={() => navigate('/profile')}
              className={`flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
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
              className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} px-4 py-2 rounded-lg transition-colors text-sm`}
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} border-t px-4 py-3 space-y-3`}>
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onClick={handleLogout}
              className={`block w-full ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} px-4 py-2 rounded-lg text-sm text-center`}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Hero Section */}
        <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg p-6 md:p-8 mb-6 md:mb-8 transition-colors duration-300`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                Welcome back, {user?.username}
              </h2>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-base md:text-lg`}>
                Transform your look with AI-powered haircut simulation
              </p>
            </div>
            <button
              onClick={() => navigate('/simulation')}
              className={`${isDark ? 'bg-white hover:bg-gray-200 text-black' : 'bg-gray-900 hover:bg-gray-800 text-white'} font-medium px-6 py-3 rounded-lg transition-colors text-sm md:text-base`}
            >
              New Simulation
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg p-4 md:p-6 transition-colors duration-300`}>
            <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Saved</p>
            <p className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalSimulations}</p>
          </div>
          <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg p-4 md:p-6 transition-colors duration-300`}>
            <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Favorites</p>
            <p className="text-2xl md:text-3xl font-bold text-yellow-500">{favoritesCount}</p>
          </div>
          <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg p-4 md:p-6 transition-colors duration-300`}>
            <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Status</p>
            <p className="text-2xl md:text-3xl font-bold text-green-500">Active</p>
          </div>
        </div>

        {/* History Grid */}
        <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg p-4 md:p-6 transition-colors duration-300`}>
          {/* Search Bar */}
          {history.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <svg
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by haircut, color, or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'} border pl-10 pr-10 py-2.5 rounded-lg text-sm focus:outline-none ${isDark ? 'focus:border-gray-500' : 'focus:border-gray-400'}`}
                />
                {hasActiveSearch && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className={`flex items-center gap-1 mb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? isDark ? 'text-white border-white' : 'text-gray-900 border-gray-900'
                  : isDark ? 'text-gray-400 border-transparent hover:text-gray-300' : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'favorites'
                  ? 'text-yellow-500 border-yellow-500'
                  : isDark ? 'text-gray-400 border-transparent hover:text-gray-300' : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill={activeTab === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Favorites
              {favoritesCount > 0 && (
                <span className="bg-yellow-400 text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>

          {/* Header with actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <h3 className={`text-lg md:text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {activeTab === 'favorites' ? 'Your Favorites' : 'Your History'}
              </h3>
              {filteredHistory.length > 0 && (
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                  {filteredHistory.length} {(activeFiltersCount > 0 || hasActiveSearch) ? 'found' : activeTab === 'favorites' ? 'favorited' : 'saved'}
                </span>
              )}
            </div>

            {history.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showFilters || activeFiltersCount > 0
                      ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                      : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                  {activeFiltersCount > 0 && (
                    <span className={`${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} text-xs px-1.5 py-0.5 rounded-full`}>
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Select/Cancel Button */}
                {selectMode ? (
                  <button
                    onClick={exitSelectMode}
                    className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} px-3 py-1.5 rounded-lg text-sm transition-colors`}
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectMode(true)}
                    className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} px-3 py-1.5 rounded-lg text-sm transition-colors`}
                  >
                    Select
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 mb-4 border`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Haircut Filter */}
                <div>
                  <label className={`block text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Haircut</label>
                  <select
                    value={filters.haircut}
                    onChange={(e) => setFilters(f => ({ ...f, haircut: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-gray-500"
                  >
                    <option value="all">All Haircuts</option>
                    {filterOptions.haircuts.map(haircut => (
                      <option key={haircut} value={haircut}>{haircut}</option>
                    ))}
                  </select>
                </div>

                {/* Hair Color Filter */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Hair Color</label>
                  <select
                    value={filters.hairColor}
                    onChange={(e) => setFilters(f => ({ ...f, hairColor: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-gray-500"
                  >
                    <option value="all">All Colors</option>
                    {filterOptions.hairColors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters(f => ({ ...f, gender: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-gray-500"
                  >
                    <option value="all">All</option>
                    {filterOptions.genders.map(gender => (
                      <option key={gender} value={gender}>{formatGender(gender)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Select Mode Actions */}
          {selectMode && (
            <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 mb-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {selectedItems.size === filteredHistory.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-gray-500 text-sm">
                  {selectedItems.size} selected
                </span>
              </div>
              <button
                onClick={handleBulkDelete}
                disabled={selectedItems.size === 0 || isDeleting}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedItems.size === 0 || isDeleting
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete ({selectedItems.size})
                  </>
                )}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">📭</div>
              <p className="text-gray-400 text-lg">No saved simulations yet</p>
              <p className="text-gray-500 text-sm mt-2">Generate and save your first hairstyle</p>
              <button
                onClick={() => navigate('/simulation')}
                className="mt-4 bg-white hover:bg-gray-200 text-black font-medium px-6 py-2 rounded-lg transition-colors text-sm"
              >
                Start Now
              </button>
            </div>
          ) : filteredHistory.length === 0 && activeTab === 'favorites' ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">⭐</div>
              <p className="text-gray-400 text-lg">No favorites yet</p>
              <p className="text-gray-500 text-sm mt-2">Click the star icon on any simulation to add it to favorites</p>
              <button
                onClick={() => setActiveTab('all')}
                className="mt-4 bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg transition-colors text-sm"
              >
                View All History
              </button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">🔍</div>
              <p className="text-gray-400 text-lg">No results found</p>
              <p className="text-gray-500 text-sm mt-2">
                {hasActiveSearch
                  ? `No simulations match "${searchQuery}"`
                  : 'Try adjusting your filters'}
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg transition-colors text-sm"
              >
                {hasActiveSearch ? 'Clear Search' : 'Clear Filters'}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => !selectMode && setSelectedImage(item)}
                    className={`relative cursor-pointer group bg-gray-800 rounded-lg overflow-hidden border transition-colors ${
                      selectMode && selectedItems.has(item.id)
                        ? 'border-white'
                        : 'border-gray-700 hover:border-white'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    {selectMode && (
                      <div
                        onClick={(e) => toggleItemSelection(item.id, e)}
                        className="absolute top-2 left-2 z-10"
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedItems.has(item.id)
                            ? 'bg-white border-white'
                            : 'border-gray-400 bg-black/50 hover:border-white'
                        }`}>
                          {selectedItems.has(item.id) && (
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Before/After Images */}
                    <div className="flex">
                      <div className="w-1/2 aspect-square relative">
                        <img
                          src={item.originalImage}
                          alt="Before"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Before</span>
                      </div>
                      <div className="w-1/2 aspect-square relative">
                        <img
                          src={item.resultImage}
                          alt="After"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-center p-2">
                          <svg className="w-8 h-8 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-500 text-xs">Expired</span>
                        </div>
                        <span className="absolute top-2 right-2 bg-white/90 text-black text-xs px-2 py-1 rounded font-medium">After</span>
                      </div>
                    </div>
                    {/* Favorite Button on Card */}
                    {!selectMode && (
                      <button
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all ${
                          item.isFavorite
                            ? 'bg-yellow-400 text-black'
                            : 'bg-black/50 text-gray-400 hover:text-yellow-400 opacity-0 group-hover:opacity-100'
                        }`}
                        title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg className="w-4 h-4" fill={item.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    )}

                    {/* Info */}
                    <div className="p-3 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-white text-sm font-medium truncate flex-1">{item.haircut}</p>
                        {item.isFavorite && (
                          <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-gray-400 text-xs truncate">{item.hairColor}</p>
                        <p className="text-gray-500 text-xs">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-gray-400 text-sm">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                        pagination.hasPrevPage
                          ? 'bg-gray-800 text-white hover:bg-gray-700'
                          : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Prev
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const { page, totalPages } = pagination;

                        // Always show first page
                        if (page > 3) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handlePageChange(1)}
                              className="w-10 h-10 rounded-lg text-sm bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                            >
                              1
                            </button>
                          );
                          if (page > 4) {
                            pages.push(
                              <span key="dots1" className="text-gray-500 px-1">...</span>
                            );
                          }
                        }

                        // Show pages around current page
                        for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`w-10 h-10 rounded-lg text-sm transition-colors ${
                                i === page
                                  ? 'bg-white text-black font-medium'
                                  : 'bg-gray-800 text-white hover:bg-gray-700'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }

                        // Always show last page
                        if (page < totalPages - 2) {
                          if (page < totalPages - 3) {
                            pages.push(
                              <span key="dots2" className="text-gray-500 px-1">...</span>
                            );
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => handlePageChange(totalPages)}
                              className="w-10 h-10 rounded-lg text-sm bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                        pagination.hasNextPage
                          ? 'bg-gray-800 text-white hover:bg-gray-700'
                          : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
