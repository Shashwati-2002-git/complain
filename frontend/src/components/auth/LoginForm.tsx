import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Mail, Lock, User, AlertCircle, UserCheck } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface LoginFormProps {
  onBack?: () => void;
}

export function LoginForm({ onBack }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'agent' | 'admin' | 'analytics',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, googleLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.name, formData.email, formData.password, formData.role);

      if (!success && isLogin) {
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError('Google login failed. No credential received.');
      return;
    }
    try {
      const success = await googleLogin(response.credential);
      if (!success) {
        setError('Google login failed. Please try again.');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login error. Please try again.');
    }
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 text-gray-400 hover:text-orange-400 transition-colors duration-200 flex items-center gap-2"
          >
            ← Back to Home
          </button>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-400">
              {isLogin
                ? 'Sign in to your complaint management account'
                : 'Join our complaint management system'}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    required={!isLogin}
                  />
                </div>

                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        role: e.target.value as 'user' | 'agent' | 'admin' | 'analytics',
                      }))
                    }
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    required={!isLogin}
                  >
                    <option value="user">User - Submit and track complaints</option>
                    <option value="agent">Agent - Handle assigned tickets</option>
                    <option value="admin">Admin - Manage system and users</option>
                    <option value="analytics">Analytics - View reports and analytics</option>
                  </select>

                  {/* Role descriptions */}
                  <div className="mt-2 text-sm text-gray-400">
                    {formData.role === 'agent' && (
                      <p>As an Agent, you can view assigned tickets, update status, add notes, and communicate with customers.</p>
                    )}
                    {formData.role === 'admin' && (
                      <p>As an Admin, you can manage users, assign tickets, view all complaints, and access system settings.</p>
                    )}
                    {formData.role === 'analytics' && (
                      <p>As an Analytics user, you get access to comprehensive reports, SLA tracking, performance metrics, and data export capabilities.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="mx-3 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed')}
            />
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-orange-400 hover:text-orange-300 font-medium transition-colors duration-200"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
