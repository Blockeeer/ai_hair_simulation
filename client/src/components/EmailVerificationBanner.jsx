import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const EmailVerificationBanner = () => {
  const { user, resendVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  // Don't show if user is verified or banner was dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');
    try {
      await resendVerification();
      setMessage('Verification email sent! Check your inbox.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-yellow-900 bg-opacity-50 border-b border-yellow-700">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-yellow-200 text-sm">
              Please verify your email address to access all features.
            </span>
          </div>
          <div className="flex items-center gap-3">
            {message && (
              <span className={`text-xs ${message.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </span>
            )}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-yellow-200 hover:text-white text-sm font-medium underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-yellow-400 hover:text-yellow-200"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
