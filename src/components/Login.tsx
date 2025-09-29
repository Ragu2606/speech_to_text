import React from 'react';
import { useStore } from '../store/useStore';
import PhoneLogin from './PhoneLogin';
import OtpVerification from './OtpVerification';

const Login: React.FC = () => {
  const { auth } = useStore();

  switch (auth.currentAuthStep) {
    case 'phone-input':
      return <PhoneLogin />;
    case 'otp-verification':
      return <OtpVerification />;
    default:
      return <PhoneLogin />;
  }
};

export default Login;
