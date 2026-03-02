'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [socialMsg, setSocialMsg] = useState('');

  const handleSocialLogin = (provider: string) => {
    setSocialMsg(`${provider} sign-in is not available yet. Please use your email and password.`);
    setTimeout(() => setSocialMsg(''), 4000);
  };

  const validateForm = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (!agreed) {
      setError('You must agree to the Terms, Privacy Policy and fees.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setError(msg.includes('credentials') || msg.includes('Unauthorized')
        ? 'Invalid email or password.'
        : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* ── LEFT PANEL — 60% ── */}
      <div className="relative flex flex-col overflow-y-auto bg-white" style={{ width: '60%' }}>
        {/* Top-left label */}
        <div className="px-10 pt-8 xl:px-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Login
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-10 py-10 xl:px-16">
          <div className="w-full max-w-sm">
            {/* Heading */}
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 text-center">
              Welcome Back
            </h1>
            <p className="mt-2 text-center text-sm text-gray-500">
              Sign Up For Free
            </p>

            {/* Error banner */}
            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Checkbox */}
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-purple-600"
                />
                <span className="text-xs text-gray-500">
                  I agree to all{' '}
                  <span className="font-medium text-purple-600">Terms</span>,{' '}
                  <span className="font-medium text-purple-600">Privacy Policy</span>{' '}
                  and fees
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Signing in…' : 'Get Started'}
              </button>
            </form>

            {/* OR divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-400">OR</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Social banner */}
            {socialMsg && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {socialMsg}
              </div>
            )}

            {/* Social buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                {/* Google G icon */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('Facebook')}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.884v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
                Sign in with Facebook
              </button>
            </div>

            {/* No account yet */}
            <p className="mt-8 text-sm text-gray-500">
              Contact your administrator to create an account.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — 40% with abstract image ── */}
      <div className="hidden lg:block relative" style={{ width: '40%' }}>
        <img
          src="/Screenshot 2026-03-03 001943.png"
          alt="Abstract wave"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
