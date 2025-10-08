import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, ArrowRight, ArrowLeft, RefreshCw, ShieldCheck, Lock } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  onVerifySuccess: () => void;
  onBack: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export function OTPVerification({ email, onVerifySuccess, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Start a countdown timer for resending OTP
  useEffect(() => {
    if (resendSuccess) {
      setTimeLeft(60);
      const timerId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerId);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [resendSuccess]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      setError('Please enter the OTP sent to your email');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to verify OTP. Please try again.');
        return;
      }

      // Store authentication data from successful verification
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccess(true);
      
      // Small delay to show success message before proceeding
      setTimeout(() => {
        onVerifySuccess();
      }, 1500);
      
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeLeft > 0) return;
    
    setResendLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to resend OTP. Please try again.');
        return;
      }

      setResendSuccess(true);
      
      // Reset the success state after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('An error occurred while resending the OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center px-8 sm:px-12 py-12 relative">
      {/* Back button for mobile */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-gray-400 hover:text-blue-600 transition-all duration-200 flex items-center gap-2 font-medium group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to login
        </button>
        
        {/* Verification image for mobile with heading */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-blue-600 mb-1">
              Join <span className="text-[#3B82F6]">QuickFix</span>
            </h1>
            <p className="text-sm text-gray-600 px-4">
              Start your journey with intelligent customer service automation verification
            </p>
          </div>
          <div className="flex justify-center">
            <div className="bg-blue-700 bg-opacity-30 rounded-xl p-4 shadow-md">
              <img 
                src="https://img.freepik.com/free-vector/cyber-data-security-online-concept-illustration-internet-security-information-privacy-protection_1150-37328.jpg?semt=ais_hybrid&w=740&q=80" 
                alt="Security Verification" 
                className="w-full h-auto max-w-[280px] rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-500 mb-2">QuickFix  </h2>
         
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Verify Your Email</h3>
          <p className="text-gray-600">
            We've sent a 6-digit verification code to <span className="font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-700 text-sm">Verification successful! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-5">
          {/* OTP Input */}
          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Verification Code
            </label>
            <div className="relative">
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest font-medium"
                placeholder="Enter 6-digit OTP"
                aria-label="OTP verification code"
                autoFocus
              />
              <Lock className="absolute right-3 top-3.5 text-gray-400 w-5 h-5" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium transition-colors ${
              loading || success 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
            }`}
          >
            {loading ? 'Verifying...' : success ? 'Verified!' : 'Verify Email'}
            {!loading && !success && <ArrowRight className="w-4 h-4" />}
            {success && <Check className="w-4 h-4" />}
          </button>
          
          {/* Resend Code */}
          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              disabled={resendLoading || timeLeft > 0}
              onClick={handleResendOTP}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg mx-auto ${
                resendLoading || timeLeft > 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-700 hover:underline focus:outline-none'
              }`}
            >
              {timeLeft > 0 ? (
                `Resend code in ${timeLeft}s`
              ) : resendLoading ? (
                'Sending...'
              ) : resendSuccess ? (
                <>
                  Code sent! <Check className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Resend code
                  <RefreshCw className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}