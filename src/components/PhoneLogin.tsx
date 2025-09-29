import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, Shield, Users, Stethoscope } from 'lucide-react';
import { useStore } from '../store/useStore';

const PhoneLogin: React.FC = () => {
  const { auth, setPhoneNumber, sendOtp } = useStore();
  const [localPhone, setLocalPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as +X-XXX-XXX-XXXX
    if (digits.length <= 10) {
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    // For international numbers, add country code
    const countryCode = digits.slice(0, -10);
    const number = digits.slice(-10);
    return `+${countryCode}-${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setLocalPhone(formatted);
    setPhoneNumber(value.replace(/\D/g, '').replace(/^(\d)/, '+$1')); // Store with + prefix
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localPhone.length < 10 || isSubmitting) return;

    setIsSubmitting(true);
    const phoneFormatted = localPhone.replace(/\D/g, '').replace(/^(\d)/, '+$1');
    await sendOtp(phoneFormatted);
    setIsSubmitting(false);
  };

  const demoNumbers = [
    { phone: '+1234567890', name: 'Dr. Rajesh Patel', role: 'Doctor' },
    { phone: '+9876543210', name: 'Nurse Sarah Johnson', role: 'Nurse' },
    { phone: '+1111111111', name: 'Admin User', role: 'Admin' },
    { phone: '+9999999999', name: 'Dr. Priya Sharma', role: 'Doctor' }
  ];

  const fillDemoNumber = (phone: string) => {
    const formatted = formatPhoneNumber(phone.replace('+', ''));
    setLocalPhone(formatted);
    setPhoneNumber(phone);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="glass rounded-2xl p-6 mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Stethoscope className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">
              CloudHew Health AI
            </h1>
            <p className="text-primary-600">
              Secure OTP Login for Healthcare Professionals
            </p>
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="glass rounded-2xl p-6 sm:p-8"
        >
          <div className="flex items-center mb-6">
            <Shield className="w-5 h-5 text-secondary-500 mr-2" />
            <h2 className="text-xl font-semibold text-primary-900">Phone Verification</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-primary-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
                <input
                  type="tel"
                  id="phone"
                  value={localPhone}
                  onChange={handlePhoneChange}
                  placeholder="Enter your phone number"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-primary-200 rounded-xl text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-transparent transition-all duration-200"
                  disabled={isSubmitting || auth.isLoading}
                />
              </div>
              <p className="text-xs text-primary-500 mt-2">
                We'll send a 6-digit OTP to verify your identity
              </p>
            </div>

            {auth.error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-3"
              >
                <p className="text-red-700 text-sm">{auth.error}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={localPhone.length < 10 || isSubmitting || auth.isLoading}
              className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 disabled:from-primary-400 disabled:to-primary-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
            >
              {isSubmitting || auth.isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full mr-2"
                  />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Demo Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6"
        >
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-secondary-500 mr-2" />
              <h3 className="text-lg font-semibold text-primary-900">Demo Users</h3>
            </div>
            <p className="text-sm text-primary-600 mb-4">
              Click any user to auto-fill their phone number (OTP: 123456)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoNumbers.map((user, index) => (
                <motion.button
                  key={user.phone}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fillDemoNumber(user.phone)}
                  className="p-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl text-left transition-all duration-200"
                >
                  <p className="font-medium text-primary-900 text-sm">{user.name}</p>
                  <p className="text-xs text-primary-600">{user.role} • {formatPhoneNumber(user.phone.replace('+', ''))}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-primary-500">
            🔒 Your data is encrypted and secure. Only authorized healthcare professionals can access this system.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PhoneLogin;
