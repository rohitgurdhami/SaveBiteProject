'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, ArrowLeft } from 'lucide-react';
import apiClient from '@/services/api';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const purpose = searchParams.get('purpose') === 'reset' ? 'reset' : 'register';
  const userId = Number(searchParams.get('userId'));
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (purpose === 'reset' && newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (purpose === 'reset') {
        await apiClient.post('/auth/reset-password', { userId, otp, newPassword });
      } else {
        await apiClient.post('/auth/verify-otp', { userId, otp });
      }

      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">SaveBite</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Verify Code</h1>
          <p className="text-muted-foreground">
            {purpose === 'reset'
              ? `Enter the code sent to ${email || 'your email'} and choose a new password`
              : `Enter the verification code sent to ${email || 'your email'}`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* OTP */}
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-2">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary tracking-widest text-center"
              required
            />
          </div>

          {purpose === 'reset' && (
            <>
              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={8}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={8}
                />
              </div>
            </>
          )}

          {/* Submit Button */}
              <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : purpose === 'reset' ? 'Reset Password' : 'Verify Code'}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Didn&apos;t get a code?{' '}
            <Link href="/forgot-password" className="text-primary font-medium hover:underline">
              Try again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}
