import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AI Hair Simulation</h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/dashboard')} variant="secondary" size="small">
              Dashboard
            </Button>
            <span className="text-gray-700">
              Welcome, {user?.firstName || user?.username}!
            </span>
            <Button onClick={handleLogout} variant="outline" size="small">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Welcome to AI Hair Simulation
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Create realistic hair simulations powered by artificial intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-purple-600 text-4xl mb-4">&#127912;</div>
            <h3 className="text-xl font-semibold mb-2">Realistic Rendering</h3>
            <p className="text-gray-600">
              Advanced physics-based rendering for lifelike hair simulation
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-purple-600 text-4xl mb-4">&#9889;</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Preview</h3>
            <p className="text-gray-600">
              See your changes instantly with our real-time simulation engine
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-purple-600 text-4xl mb-4">&#129302;</div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-600">
              Leverage AI to generate and optimize hair styles automatically
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="secondary"
            size="large"
            className="px-8"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => navigate('/simulation')}
            size="large"
            className="px-8"
          >
            Start Simulation
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Home;
