import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LogOut, User, Shield } from 'lucide-react';
import { useStore } from './store/useStore';
import Login from './components/Login';
import PatientSelection from './components/PatientSelection';
import PatientDetails from './components/PatientDetails';
import Consultation from './components/Consultation';
import ConsultationSummary from './components/ConsultationSummary';
import DarkModeToggle from './components/DarkModeToggle';
import OllamaConfig from './components/OllamaConfig';
import RealtimeConsultation from './components/RealtimeConsultation';

function App() {
  const { currentScreen, setTheme, auth, initializeAuth, logout } = useStore();
  const [showOllamaConfig, setShowOllamaConfig] = useState(false);

  // Initialize theme and auth from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'ocean' | 'forest' | null) || 'light';
    setTheme(savedTheme);
    initializeAuth();
    
    // Check if Ollama is configured
    const ollamaConfigured = localStorage.getItem('ollama_configured');
    if (!ollamaConfigured && auth.isAuthenticated) {
      setShowOllamaConfig(true);
    }
  }, [setTheme, initializeAuth, auth.isAuthenticated]);

  const renderCurrentScreen = () => {
    // Show Ollama configuration if needed
    if (showOllamaConfig) {
      return <OllamaConfig key="ollama-config" onConfigured={() => setShowOllamaConfig(false)} />;
    }

    switch (currentScreen) {
      case 'login':
        return <Login key="login" />;
      case 'patient-selection':
        return <PatientSelection key="patient-selection" />;
      case 'patient-details':
        return <PatientDetails key="patient-details" />;
      case 'consultation':
        return <Consultation key="consultation" />;
      case 'realtime-consultation':
        return <RealtimeConsultation key="realtime-consultation" />;
      case 'summary':
        return <ConsultationSummary key="summary" />;
      default:
        return auth.isAuthenticated ? <PatientSelection key="default" /> : <Login key="default" />;
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top Bar with Auth Info and Controls */}
      <div className="fixed-header flex items-center space-x-2 sm:space-x-3">
        {/* User Info (only when authenticated) */}
        {auth.isAuthenticated && auth.user && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-2 sm:p-3 flex items-center space-x-2 sm:space-x-3 max-w-xs sm:max-w-sm"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="hidden sm:block min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-primary-900 truncate">{auth.user.name}</p>
              <p className="text-xs text-primary-600 flex items-center">
                <Shield className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{auth.user.role}</span>
              </p>
            </div>
            <div className="sm:hidden min-w-0 flex-1">
              <p className="text-xs font-medium text-primary-900 truncate">{auth.user.name.split(' ')[0]}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-1 sm:p-2 text-primary-600 hover:text-accent-600 hover:bg-white/20 rounded-lg transition-all duration-200 flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.button>
          </motion.div>
        )}
        
        {/* Dark Mode Toggle */}
        <DarkModeToggle />
      </div>
      
      <AnimatePresence mode="wait">
        {renderCurrentScreen()}
      </AnimatePresence>
    </div>
  );
}

export default App;