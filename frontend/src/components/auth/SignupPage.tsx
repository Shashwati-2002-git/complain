import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { 
  Shield, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Zap,
  Clock,
  Users
} from 'lucide-react';

interface SignupPageProps {
  onBack?: () => void;
  onLoginClick?: () => void;
}

export function SignupPage({ onBack, onLoginClick }: SignupPageProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    company: '',
    organizationSize: '',
    phone: '',
    role: 'user' as 'user' | 'agent' | 'admin' | 'analytics',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, googleLogin } = useAuth();

  const organizationSizes = [
    '1-10 employees',
    '11-50 employees', 
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

  const benefits = [
    { 
      icon: Zap,
      title: '75% reduction in ticket resolution time',
      color: 'text-green-600'
    },
    {
      icon: Clock, 
      title: '< 3 month payback period',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      title: '54 hours per agent per year saved with automations',
      color: 'text-purple-600'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await register(
        `${formData.firstName} ${formData.lastName}`.trim(),
        formData.email,
        formData.password,
        formData.role
      );

      if (!success) {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError('Google signup failed. No credential received.');
      return;
    }
    try {
      const success = await googleLogin(response.credential);
      if (!success) {
        setError('Google signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Google signup error:', err);
      setError('Google signup failed. Please try again.');
    }
  };

  const handleFacebookLogin = () => {
    const clientId = import.meta.env.VITE_FACEBOOK_APP_ID;
    const redirectUri = `${window.location.origin}/auth/facebook/callback`;
    const scope = 'email,public_profile';
    
    if (!clientId) {
      setError('Facebook OAuth is not configured');
      return;
    }

    // Redirect to Facebook OAuth
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=signup&response_type=code`;
    window.location.href = facebookAuthUrl;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Left Side - Dashboard Preview & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white rounded-full"></div>
          <div className="absolute bottom-40 right-20 w-24 h-24 border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 border border-white rounded-full"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center max-w-lg w-full">
          {/* Dashboard Mockup Image */}
          <div className="mb-8 relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <img 
                src="/login&signup.webp" 
                alt="QuickFix Dashboard Interface - Real-time complaint management system" 
                className="w-full h-auto rounded-xl shadow-lg object-cover transition-transform duration-300 hover:scale-105"
                style={{ 
                  maxHeight: '280px', 
                  minHeight: '200px',
                  objectPosition: 'center top'
                }}
                loading="lazy"
                onError={(e) => {
                  console.log('Image failed to load');
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute -bottom-2 -right-2 bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-semibold shadow-lg animate-pulse">
                Live Preview
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-6 leading-tight">
            Sign up for a 14-day free trial.
          </h1>
          
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex items-center space-x-3">
                  <benefit.icon className={`w-4 h-4 ${benefit.color}`} />
                  <span className="text-base font-medium">{benefit.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Try <span className="text-indigo-600">QuickFix</span> for free
            </h2>
            <p className="text-gray-600">
              No credit card required. No strings attached.
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google signup failed')}
                size="large"
                width="100%"
                text="signup_with"
                theme="outline"
              />
            </GoogleOAuthProvider>
            
            <button
              onClick={handleFacebookLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Please complete this required field"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a secure password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Enter your company"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Organization Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization size <span className="text-red-500">*</span>
              </label>
              <select
                name="organizationSize"
                required
                value={formData.organizationSize}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">Please select</option>
                {organizationSizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Start Free Trial'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onLoginClick}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Sign in
            </button>
          </div>

          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignupPage;