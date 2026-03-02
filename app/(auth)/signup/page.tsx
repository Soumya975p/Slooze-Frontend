'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';
import { REGISTER_MUTATION } from '@/lib/graphql/auth';
import type { AuthPayload, UserRole } from '@/lib/types';

interface RegisterResult { register: AuthPayload }

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'STORE_KEEPER', label: 'Store Keeper', description: 'Manage and view inventory' },
  { value: 'MANAGER', label: 'Manager', description: 'Full access including dashboard & reports' },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<UserRole>('STORE_KEEPER');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const [register, { loading }] = useMutation<RegisterResult>(REGISTER_MUTATION, {
    onCompleted: ({ register: result }) => {
      // Store token and role (same as login flow)
      localStorage.setItem('slooze_token', result.access_token);
      Cookies.set('slooze_token', result.access_token, { expires: 7 });
      Cookies.set('slooze_role', result.user.role, { expires: 7 });
      // Redirect based on role
      router.push(result.user.role === 'MANAGER' ? '/dashboard' : '/products');
    },
    onError: (err) => {
      const msg = err.message;
      setError(msg.includes('already') ? 'An account with this email already exists.' : msg);
    },
  });

  const validate = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.'); return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.'); return false;
    }
    if (password !== confirm) {
      setError('Passwords do not match.'); return false;
    }
    if (!agreed) {
      setError('You must agree to the Terms, Privacy Policy and fees.'); return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    await register({ variables: { email, password, role } });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* ── LEFT PANEL ── */}
      <div className="relative flex w-full flex-col overflow-y-auto bg-white lg:w-1/2">
        {/* Top-left label */}
        <div className="px-10 pt-8 xl:px-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Sign Up
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center px-10 py-10 xl:px-16">
          <div className="w-full max-w-sm">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-gray-500">Sign up for free — no credit card needed</p>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Role selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`rounded-xl border-2 p-3 text-left transition ${
                        role === r.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${role === r.value ? 'text-purple-700' : 'text-gray-800'}`}>
                        {r.label}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">{r.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
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

              {/* Confirm Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full rounded-lg border bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-purple-200 ${
                      confirm && confirm !== password
                        ? 'border-red-400 focus:border-red-400'
                        : 'border-gray-300 focus:border-purple-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                )}
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
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            {/* Already have account */}
            <p className="mt-8 text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-purple-600 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-900 via-purple-800 to-pink-600" />
        <div className="absolute -top-32 -right-32 h-125 w-125 rounded-full bg-purple-500 opacity-30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-100 w-100 rounded-full bg-pink-500 opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-150 w-150 rounded-full bg-indigo-600 opacity-20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-12">
          {/* Feature list */}
          <div className="w-full max-w-xs">
            <h2 className="text-3xl font-extrabold text-white drop-shadow">Join Slooze</h2>
            <p className="mt-2 text-sm text-white/60">Everything you need to manage commodities</p>
            <div className="mt-6 space-y-4">
              {[
                { icon: '📊', title: 'Real-time Dashboard', desc: 'Live stats and analytics at a glance' },
                { icon: '📦', title: 'Product Management', desc: 'Full CRUD for your commodity catalog' },
                { icon: '🔐', title: 'Role-based Access', desc: 'Manager and Store Keeper roles built-in' },
                { icon: '🌙', title: 'Dark Mode', desc: 'Easy on the eyes, day or night' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/20">
                  <span className="text-xl">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-white/60">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
