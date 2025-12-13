'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onSwitchToSignup?: () => void;
  onSuccess?: () => void;
  isDark?: boolean;
}

export default function LoginForm({ onSwitchToSignup, onSuccess, isDark = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to login',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="login-email"
          className={`block text-sm font-medium mb-1 ${
            isDark ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
          }`}
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full rounded-xl border px-4 py-3 text-sm transition-colors ${
            isDark
              ? 'border-[#3a2f2a] bg-[#2a1f1a] text-[#f5e6dc] placeholder:text-[#7d6b5f] focus:border-[#c24f63] focus:ring-2 focus:ring-[#c24f63]/30'
              : 'border-[#eaded0] bg-white text-[#1f120f] placeholder:text-[#9b867f] focus:border-[#c24f63] focus:ring-2 focus:ring-[#c24f63]/30'
          } outline-none`}
          placeholder="you@example.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="login-password"
          className={`block text-sm font-medium mb-1 ${
            isDark ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
          }`}
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full rounded-xl border px-4 py-3 text-sm transition-colors ${
            isDark
              ? 'border-[#3a2f2a] bg-[#2a1f1a] text-[#f5e6dc] placeholder:text-[#7d6b5f] focus:border-[#c24f63] focus:ring-2 focus:ring-[#c24f63]/30'
              : 'border-[#eaded0] bg-white text-[#1f120f] placeholder:text-[#9b867f] focus:border-[#c24f63] focus:ring-2 focus:ring-[#c24f63]/30'
          } outline-none`}
          placeholder="••••••••"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password}</p>
        )}
      </div>

      {errors.submit && (
        <div className={`rounded-xl border p-3 ${
          isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-300 bg-red-50'
        }`}>
          <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full rounded-full px-6 py-3 text-sm font-semibold transition-all ${
          isLoading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:scale-105 hover:shadow-lg'
        } ${
          isDark
            ? 'bg-[#c24f63] text-white hover:bg-[#d15f73]'
            : 'bg-[#c24f63] text-white hover:bg-[#d15f73]'
        }`}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      {onSwitchToSignup && (
        <p className={`text-center text-sm ${
          isDark ? 'text-[#b8998a]' : 'text-[#5b4743]'
        }`}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-[#c24f63] hover:underline"
          >
            Sign up
          </button>
        </p>
      )}
    </form>
  );
}

