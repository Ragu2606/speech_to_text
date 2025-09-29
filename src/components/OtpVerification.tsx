import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Timer, RefreshCw, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

const OtpVerification: React.FC = () => {
  const { auth, setOtpCode, verifyOtp, sendOtp, setAuthStep } = useStore();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Auto-submit when all digits are filled
  useEffect(() => {
    const otp = otpDigits.join('');
    if (otp.length === 6) {
      setOtpCode(otp);
      handleVerifyOtp(otp);
    }
  }, [otpDigits, setOtpCode]);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // Take only the last digit
    setOtpDigits(newDigits);

    // Move to next input if digit entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = pasteData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtpDigits(newDigits);

    // Focus the next empty input or the last input
    const nextEmptyIndex = newDigits.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerifyOtp = async (otp: string) => {
    if (otp.length !== 6 || isSubmitting) return;

    setIsSubmitting(true);
    const success = await verifyOtp(otp);
    setIsSubmitting(false);

    if (!success) {
      // Clear OTP on failure
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (isResending) return;

    setIsResending(true);
    const success = await sendOtp(auth.phoneNumber);
    setIsResending(false);

    if (success) {
      setTimeLeft(300); // Reset timer
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleBack = () => {
    setAuthStep('phone-input');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{1,3})(\d{3})(\d{3})(\d{4})/, '+$1 $2-$3-$4');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="glass rounded-2xl p-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-primary-900 mb-2">
              Verify Your Identity
            </h1>
            <p className="text-primary-600 text-sm">
              Enter the 6-digit code sent to
            </p>
            <p className="text-primary-900 font-medium">
              {formatPhoneNumber(auth.phoneNumber)}
            </p>
          </div>
        </motion.div>

        {/* OTP Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="glass rounded-2xl p-6 sm:p-8"
        >
          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-4 text-center">
                Enter 6-digit OTP
              </label>
              <div className="otp-container">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="otp-input w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-center text-lg sm:text-xl font-bold bg-white/50 border-2 border-primary-200 rounded-xl focus:border-secondary-400 focus:ring-2 focus:ring-secondary-200 focus:outline-none transition-all duration-200"
                    disabled={isSubmitting || auth.isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center space-x-2">
              <Timer className="w-4 h-4 text-primary-500" />
              <span className="text-primary-600 text-sm">
                Code expires in {formatTime(timeLeft)}
              </span>
            </div>

            {auth.error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-3"
              >
                <p className="text-red-700 text-sm text-center">{auth.error}</p>
              </motion.div>
            )}

            {/* Loading State */}
            {(isSubmitting || auth.isLoading) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-secondary-300 border-t-secondary-600 rounded-full"
                />
                <span className="text-primary-600">Verifying...</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6 space-y-4"
        >
          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-primary-600 text-sm mb-2">Didn't receive the code?</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResendOtp}
              disabled={timeLeft > 0 || isResending}
              className="inline-flex items-center text-secondary-600 hover:text-secondary-700 disabled:text-primary-400 font-medium text-sm transition-colors duration-200"
            >
              {isResending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-secondary-300 border-t-secondary-600 rounded-full mr-2"
                  />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend OTP {timeLeft > 0 && `(${formatTime(timeLeft)})`}
                </>
              )}
            </motion.button>
          </div>

          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBack}
            className="w-full glass rounded-xl py-3 px-6 flex items-center justify-center text-primary-600 hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change Phone Number
          </motion.button>
        </motion.div>

        {/* Demo Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-6"
        >
          <div className="glass rounded-xl p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-primary-600">
              <strong>Demo Mode:</strong> Use OTP code <span className="font-mono bg-primary-100 px-2 py-1 rounded">123456</span> for any number
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OtpVerification;
