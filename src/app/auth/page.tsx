'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import LoginForm from '@/app/components/auth/LoginForm';
import SignUpForm from '@/app/components/auth/SignUpForm';
import { Playfair_Display, Space_Grotesk } from 'next/font/google';

const headlineFont = Playfair_Display({ subsets: ['latin'], weight: ['600', '700', '900'] });
const bodyFont = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'] });

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('creoDarkMode');
      setIsDarkMode(savedMode === 'true');
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-[#1a120e]' : 'bg-[#fff4ec]'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c24f63] mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-[#1a120e] via-[#1f1410] to-[#1a0f0c]' 
        : 'bg-gradient-to-br from-[#fffaf6] via-[#fff0e8] to-[#ffe8e8]'
    }`}>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`${headlineFont.className} text-4xl font-bold mb-2 ${
              isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
            }`}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className={`text-sm ${
              isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
            }`}>
              {isLogin 
                ? 'Sign in to continue your learning journey' 
                : 'Start your learning journey today'
              }
            </p>
          </div>

          {/* Auth Form Card */}
          <div className={`rounded-3xl border p-8 shadow-xl transition-colors duration-300 ${
            isDarkMode 
              ? 'border-[#3a2f2a] bg-[#1f1410]' 
              : 'border-[#f2e1d8] bg-white'
          }`}>
            {isLogin ? (
              <LoginForm
                onSwitchToSignup={() => setIsLogin(false)}
                onSuccess={() => router.push('/dashboard')}
                isDark={isDarkMode}
              />
            ) : (
              <SignUpForm
                onSwitchToLogin={() => setIsLogin(true)}
                onSuccess={() => router.push('/dashboard')}
                isDark={isDarkMode}
              />
            )}
          </div>

          {/* Footer */}
          <p className={`text-center text-xs mt-6 ${
            isDarkMode ? 'text-[#7d6b5f]' : 'text-[#9b867f]'
          }`}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
