import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Palette } from 'lucide-react';
import { useStore } from '../store/useStore';

const DarkModeToggle: React.FC = () => {
  const { theme, toggleDarkMode, setTheme } = useStore();

  return (
    <div className="flex items-center space-x-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleDarkMode}
        className="glass rounded-xl p-3 hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <motion.div
          animate={{ rotate: theme === 'dark' ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-primary-600" />
          )}
        </motion.div>
      </motion.button>

      <div className="glass rounded-xl px-2 py-1 flex items-center">
        <Palette className="w-4 h-4 text-primary-600 mr-2" />
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'ocean' | 'forest')}
          className="bg-transparent outline-none text-sm text-primary-900"
          aria-label="Select theme"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="ocean">Ocean</option>
          <option value="forest">Forest</option>
        </select>
      </div>
    </div>
  );
};

export default DarkModeToggle;
