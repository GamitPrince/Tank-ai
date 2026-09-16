import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2, X, AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { GoogleIcon } from '../components/GoogleIcon';
import { useApp } from '../store';


export function Login() {
  const { loginWithGoogle } = useApp();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Real Google OAuth popup flow using Authorization Code flow
  const signInWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      try {
        // Fetch user info from Google's userinfo endpoint using the access token
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch user info from Google.');

        const profile = await res.json();

        loginWithGoogle({
          email: profile.email,
          name: profile.name || profile.given_name || profile.email,
          avatar: profile.picture,
        });

        navigate('/industries');
      } catch (err) {
        setError('Google sign-in failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed. Please try again.');
      setIsLoading(false);
    },
    onNonOAuthError: () => {
      setError('Unable to open Google sign-in popup. Check your browser settings.');
      setIsLoading(false);
    },
    flow: 'implicit',
  });

  const handleSignIn = () => {
    setIsLoading(true);
    setError('');
    signInWithGoogle();
  };

  return (
    <div className="relative flex min-h-full w-full max-w-[430px] flex-col sm:min-h-0 sm:max-w-[460px] sm:rounded-2xl sm:bg-surface sm:px-10 sm:py-12 sm:shadow-soft-lg md:px-12 md:py-14">
      <div className="absolute right-0 top-0 sm:right-6 sm:top-6">
        <ThemeToggle compact />
      </div>

      <div className="flex flex-1 flex-col justify-center pt-6 sm:flex-none sm:pt-0">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo variant="split" size="lg" />
        </div>

        {/* Heading */}
        <div className="mb-10 text-center">
          <h1 className="text-[22px] font-bold text-ink">Welcome back</h1>
          <p className="mt-2 text-[14px] text-muted">
            Sign in with your Google account to continue
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-danger/10 p-3 text-[13px] font-medium text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError('')} className="shrink-0 text-danger/60 hover:text-danger">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isLoading}
          className="group relative flex w-full items-center justify-center gap-3 rounded-full border-2 border-line bg-canvas px-4 py-4 text-[15px] font-bold text-ink shadow-sm transition-all duration-200 hover:border-brand/50 hover:bg-surface active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
              <span className="text-brand">Signing in...</span>
            </>
          ) : (
            <>
              <GoogleIcon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {/* Info note */}
        <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
          Admin access is granted automatically to authorised accounts.
          <br />
          Other users will need an admin to enable their industry access.
        </p>
      </div>
    </div>
  );
}
