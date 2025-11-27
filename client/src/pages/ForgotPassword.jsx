import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">AI Hair Simulation</h1>
          <h2 className="mt-6 text-xl font-semibold text-white">
            {success ? 'Check your email' : 'Forgot your password?'}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {success
              ? 'We sent you an email with a link to reset your password.'
              : 'Enter your email address and we\'ll send you a link to reset your password.'}
          </p>
        </div>

        {success ? (
          /* Success State */
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-900 bg-opacity-50 mb-4">
                <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <p className="text-gray-300 mb-6">
                If an account exists with <span className="text-white font-medium">{email}</span>, you will receive a password reset link shortly.
              </p>

              <p className="text-sm text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium text-sm transition-colors"
                >
                  Try another email
                </button>

                <Link
                  to="/login"
                  className="block w-full text-center text-gray-400 hover:text-white transition-colors text-sm py-2"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-lg border border-gray-800 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-gray-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
                isLoading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
