import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await api.post('/auth/verify-email', { token });
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to verify email. The link may have expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">AI Hair Simulation</h1>
          <h2 className="mt-6 text-xl font-semibold text-white">
            {status === 'verifying' && 'Verifying your email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>
        </div>

        <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
          <div className="text-center">
            {status === 'verifying' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-800 mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
                <p className="text-gray-300">Please wait while we verify your email address...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-900 bg-opacity-50 mb-4">
                  <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-300 mb-6">{message}</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-white text-black py-3 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
                >
                  Go to Dashboard
                </button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-900 bg-opacity-50 mb-4">
                  <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="block w-full bg-white text-black py-3 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors text-center"
                  >
                    Go to Login
                  </Link>
                  <p className="text-sm text-gray-500">
                    Need a new verification link?{' '}
                    <Link to="/login" className="text-white hover:underline">
                      Login and request one
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
