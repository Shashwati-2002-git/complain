import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, User, AlertCircle, UserCheck, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import validateGoogleConfig from '../../services/googleAuthDebug';
import { OTPVerification } from './OTPVerification';
import { redirectToDashboard } from '../../utils/authRedirectUtils';

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Debug Google Sign-In configuration on component mount
  useEffect(() => {
    validateGoogleConfig();
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'agent' | 'admin' | 'analytics',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get auth context including OTP verification
  const { login, register, googleLogin, pendingVerification, cancelVerification } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log(`Submitting form with role: ${formData.role}`);
      
      const success = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.name, formData.email, formData.password, formData.role);

      if (!success) {
        setError(isLogin ? 'Invalid email or password' : `Registration failed. Please check if your email is already registered or if the password meets complexity requirements.`);
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Show the specific error message if available
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (credentialResponse.credential) {
        console.log('Google credential received, attempting login...');
        const success = await googleLogin(credentialResponse.credential);
        if (!success) {
          setError('Google authentication failed');
        } else {
          console.log('Google authentication successful, redirecting to dashboard...');
          // Use the redirect utility to navigate based on user role
          redirectToDashboard();
        }
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
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
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${isLogin ? 'login' : 'signup'}&response_type=code`;
    window.location.href = facebookAuthUrl;
  };

  // Debug Google Client ID
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  console.log('Google Client ID:', googleClientId);
  if (!googleClientId) {
    console.error('ERROR: Google Client ID is missing in environment variables!');
  }
  
  // Handle OTP verification success
  const handleVerificationSuccess = () => {
    // This will be called after successful OTP verification
    // The auth context will already have updated the user state
    console.log("OTP verification successful");
    
    // Get user data from localStorage to determine role
    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;
    const role = user?.role || 'user';
    
    console.log(`OTP verification successful, user role: ${role}`);
    
    // Redirect to the dashboard based on user role
    redirectToDashboard();
  };

  // Show OTP verification screen if there's a pending verification
  if (pendingVerification) {
    return (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
        <div className="min-h-screen bg-white flex">
          {/* Left Side - Image and branding */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute bottom-32 right-20 w-24 h-24 bg-blue-300 rounded-full"></div>
              <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-blue-400 rounded-full"></div>
            </div>
            
            {/* Back button in left panel */}
            <button
              type="button"
              onClick={cancelVerification}
              className="absolute top-8 left-8 text-white hover:text-blue-200 transition-all duration-200 flex items-center gap-2 font-medium text-lg z-20"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to login
            </button>
            
            <div className="relative z-10 flex flex-col justify-center items-center px-12 py-8 h-full">
              {/* Text overlay heading similar to sign-in page */}
              <div className="absolute top-20 inset-x-0 z-20 px-12">
                <h1 className="text-4xl font-bold text-white mb-4">
                  Join <span className="text-[#77BEF0]">QuickFix</span>
                </h1>
                <p className="text-xl text-blue-100">
                  Start your journey with intelligent customer service automation verification
                </p>
              </div>
              
              {/* Security verification image on left side - full size */}
              <div className="flex-grow flex items-center justify-center w-full h-full mt-24">
                <img 
                  src="security-verification.png" 
                  alt="auth-verification" 
                  className="w-full h-auto object-contain max-h-[550px]"
                />
              </div>
            </div>
          </div>
          
          {/* Right Side - OTP Verification */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <OTPVerification 
              email={pendingVerification.email}
              onVerifySuccess={handleVerificationSuccess}
              onBack={cancelVerification}
            />
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  // Render the main component
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <div className="min-h-screen bg-white flex">
        {/* Left Side - Benefits */}
        {/* Left Side - Benefits */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute bottom-32 right-20 w-24 h-24 bg-blue-300 rounded-full"></div>
            <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-blue-400 rounded-full"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 py-20">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">
                {isLogin ? 'Welcome to' : 'Join'}{' '}
                <span className="text-[#77BEF0]">QuickFix</span>
              </h1>
              <p className="text-xl text-blue-100">
                {isLogin 
                  ? 'The AI-powered customer service platform that revolutionizes complaint management'
                  : 'Start your journey with intelligent customer service automation'
                }
              </p>
            </div>
            
            {/* Dynamic Customer Service Image */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={isLogin ? "/login.png" : "/Signup.webp"}
                  alt={isLogin ? "QuickFix Customer Service Features" : "QuickFix Support Agent Platform"}
                  className="w-full max-w-lg h-auto rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 relative">
          {/* Enhanced Back Button */}
          <Link
            to="/"
            className="absolute top-6 left-6 text-gray-400 hover:text-blue-600 transition-all duration-200 flex items-center gap-2 font-medium text-lg group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
          </Link>

          <div className="max-w-md w-full mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Sign in to your account' : 'Create your account'}
              </h2>
              <p className="text-gray-600">
                {isLogin 
                  ? 'Access your complaint management dashboard'
                  : 'Start managing complaints with AI assistance'
                }
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Social Login */}
            <div className="space-y-3 mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed')}
                size="large"
                width="100%"
                text={isLogin ? "signin_with" : "signup_with"}
                theme="outline"
              />
              
              {/* Facebook Login Button */}
              <button
                type="button"
                onClick={handleFacebookLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {isLogin ? "Continue with Facebook" : "Sign up with Facebook"}
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

            {/* Login/Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="name"
                      type="text"
                      required={!isLogin}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type *
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'agent' | 'admin' | 'analytics' })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                    >
                      <option value="user">Customer / User</option>
                      <option value="agent">Support Agent</option>
                      <option value="admin">Administrator</option>
                      <option value="analytics">Analytics Manager</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}