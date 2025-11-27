import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalSimulations: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/history?limit=12');
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
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

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this simulation?')) return;

    try {
      await api.delete(`/history/${id}`);
      setHistory(history.filter(item => item.id !== id));
      setStats(prev => ({ ...prev, totalSimulations: prev.totalSimulations - 1 }));
      setSelectedImage(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black">
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
              <div>
                <h3 className="text-white font-medium">{selectedImage.haircut} - {selectedImage.hairColor}</h3>
                <p className="text-gray-400 text-sm">{formatDate(selectedImage.createdAt)}</p>
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
                  <img
                    src={selectedImage.resultImage}
                    alt="After"
                    className="w-full rounded-lg border-2 border-white"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
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
      <header className="bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <h1 className="text-lg md:text-xl font-bold text-white">AI Hair Simulation</h1>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate('/simulation')}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Simulation
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => navigate('/profile')}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              {user?.username}
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
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
          <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-3 space-y-3">
            <button
              onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 w-full text-left text-white py-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {user?.username}
            </button>
            <button
              onClick={() => { navigate('/simulation'); setMobileMenuOpen(false); }}
              className="block w-full text-left text-gray-400 hover:text-white py-2 text-sm"
            >
              Simulation
            </button>
            <button
              onClick={handleLogout}
              className="block w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm text-center"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Hero Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Welcome back, {user?.username}
              </h2>
              <p className="text-gray-400 text-base md:text-lg">
                Transform your look with AI-powered haircut simulation
              </p>
            </div>
            <button
              onClick={() => navigate('/simulation')}
              className="bg-white hover:bg-gray-200 text-black font-medium px-6 py-3 rounded-lg transition-colors text-sm md:text-base"
            >
              New Simulation
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
            <p className="text-xs md:text-sm font-medium text-gray-400 mb-1">Saved Simulations</p>
            <p className="text-2xl md:text-3xl font-bold text-white">{stats.totalSimulations}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
            <p className="text-xs md:text-sm font-medium text-gray-400 mb-1">Recent</p>
            <p className="text-2xl md:text-3xl font-bold text-white">{history.length}</p>
          </div>
          <div className="hidden md:block bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm font-medium text-gray-400 mb-1">Status</p>
            <p className="text-3xl font-bold text-green-500">Active</p>
          </div>
        </div>

        {/* History Grid */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-semibold text-white">Your History</h3>
            {history.length > 0 && (
              <span className="text-gray-400 text-sm">{history.length} saved</span>
            )}
          </div>

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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedImage(item)}
                  className="cursor-pointer group bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-white transition-colors"
                >
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
                          e.target.src = item.originalImage;
                        }}
                      />
                      <span className="absolute top-2 right-2 bg-white/90 text-black text-xs px-2 py-1 rounded font-medium">After</span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3 border-t border-gray-700">
                    <p className="text-white text-sm font-medium truncate">{item.haircut}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-gray-400 text-xs truncate">{item.hairColor}</p>
                      <p className="text-gray-500 text-xs">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
