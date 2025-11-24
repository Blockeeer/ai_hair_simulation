import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Simple Black Navbar */}
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">AI Hair Simulation</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.username}
              </h2>
              <p className="text-gray-400 text-lg">
                Transform your look with AI-powered haircut simulation
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Total Simulations</p>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <div className="text-4xl opacity-50">🎨</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Saved Styles</p>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <div className="text-4xl opacity-50">💾</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">AI Generations</p>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <div className="text-4xl opacity-50">✨</div>
            </div>
          </div>
        </div>

        {/* Main CTA Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/2 p-8 md:p-12">
              <h3 className="text-3xl font-bold text-white mb-4">
                Try Your New Haircut Today
              </h3>
              <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                Upload your photo and let our AI show you how different hairstyles would look on you.
                Instant results, no commitment.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-white mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  AI-powered realistic results
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-white mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24+ hairstyle options
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-white mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Instant before & after preview
                </li>
              </ul>
              <button
                onClick={() => navigate('/simulation')}
                className="bg-white hover:bg-gray-200 text-black font-medium px-8 py-3 rounded-lg transition-colors w-full md:w-auto"
              >
                Start New Simulation →
              </button>
            </div>
            <div className="md:w-1/2 bg-gray-800 flex items-center justify-center p-12">
              <div className="text-center">
                <div className="text-9xl mb-4 opacity-80">💇</div>
                <p className="text-gray-400 font-medium">Your transformation awaits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <p className="text-gray-400 text-lg">No simulations yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first hairstyle simulation to get started</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
