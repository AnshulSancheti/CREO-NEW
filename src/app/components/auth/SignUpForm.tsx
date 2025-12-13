'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface SignUpFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
  isDark?: boolean;
}

export default function SignUpForm({ onSwitchToLogin, onSuccess, isDark = false }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { signup } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    // Validation
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordError = validatePassword(password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password);
      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard');
        }
      }, 1000);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="signup-email"
          className={`block text-sm font-medium mb-1 ${
            isDark ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
          }`}
        >
          Email
        </label>
        <input
          id="signup-email"
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
          htmlFor="signup-password"
          className={`block text-sm font-medium mb-1 ${
            isDark ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
          }`}
        >
          Password
        </label>
        <input
          id="signup-password"
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
        <p className={`mt-1 text-xs ${
          isDark ? 'text-[#7d6b5f]' : 'text-[#9b867f]'
        }`}>
          Must be 8+ characters with uppercase, lowercase, and number
        </p>
      </div>

      <div>
        <label
          htmlFor="signup-confirm-password"
          className={`block text-sm font-medium mb-1 ${
            isDark ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
          }`}
        >
          Confirm Password
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full rounded-xl border px-4 py-3 text-sm transition-colors ${
            isDark
              ? 'border-[#3a2f2a] bg-[#2a1f1a] text-[#f5e6dc] placeholder:text-[#7d6b5f] focus:border-[#c24f63] focus:ring-2 focus:ring-[#c24f63]/30'
              : 'border-[#eaded0] bg-white text-[#1f120f] placeholder:text-[#9b867f] focus:border-[#c24f63] focus:ring-2 focus:ring-[#c24f63]/30'
          } outline-none`}
          placeholder="••••••••"
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      {errors.submit && (
        <div className={`rounded-xl border p-3 ${
          isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-300 bg-red-50'
        }`}>
          <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
        </div>
      )}

      {successMessage && (
        <div className={`rounded-xl border p-3 ${
          isDark ? 'border-green-500/30 bg-green-500/10' : 'border-green-300 bg-green-50'
        }`}>
          <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
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
        {isLoading ? 'Creating account...' : 'Sign Up'}
      </button>

      {onSwitchToLogin && (
        <p className={`text-center text-sm ${
          isDark ? 'text-[#b8998a]' : 'text-[#5b4743]'
        }`}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-[#c24f63] hover:underline"
          >
            Sign in
          </button>
        </p>
      )}
    </form>
  );
}

