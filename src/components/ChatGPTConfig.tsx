import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { initializeSimpleChatGPTPipeline } from '../utils/simpleChatGPTPipeline';

interface ChatGPTConfigProps {
  onConfigured: () => void;
}

const ChatGPTConfig: React.FC<ChatGPTConfigProps> = ({ onConfigured }) => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_CHATGPT_API_KEY || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-configure if API key is available from environment
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_CHATGPT_API_KEY;
    if (envApiKey && envApiKey !== 'your_chatgpt_api_key_here') {
      handleAutoConfigure(envApiKey);
    }
  }, []);

  const handleAutoConfigure = async (apiKeyValue: string) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const pipeline = initializeSimpleChatGPTPipeline(apiKeyValue.trim());
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const status = pipeline.getStatus();
      if (status.initialized) {
        setSuccess(true);
        setTimeout(() => {
          onConfigured();
        }, 1500);
      } else {
        setError('Failed to initialize ChatGPT service with environment API key.');
      }
    } catch (error) {
      console.error('Auto-configuration error:', error);
      setError('Failed to auto-configure ChatGPT with environment API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter your ChatGPT API key');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Initialize the Simple ChatGPT medical pipeline
      const pipeline = initializeSimpleChatGPTPipeline(apiKey.trim());
      
      // Wait a moment for initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if initialization was successful
      const status = pipeline.getStatus();
      if (status.initialized) {
        setSuccess(true);
        // Store API key in localStorage for future use
        localStorage.setItem('chatgpt_api_key', apiKey.trim());
        setTimeout(() => {
          onConfigured();
        }, 1500);
      } else {
        setError('Failed to initialize ChatGPT service. Please check your API key.');
      }
    } catch (error) {
      console.error('ChatGPT configuration error:', error);
      setError('Failed to configure ChatGPT. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ChatGPT Configuration</h1>
          <p className="text-gray-600">
            Enter your OpenAI API key to enable fast medical analysis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your API key is stored locally and never shared
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm">ChatGPT configured successfully!</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading || !apiKey.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Configuring...</span>
              </>
            ) : (
              <span>Configure ChatGPT</span>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">How to get your API key:</h3>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com/api-keys</a></li>
            <li>2. Sign in to your OpenAI account</li>
            <li>3. Click "Create new secret key"</li>
            <li>4. Copy the key and paste it here</li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatGPTConfig;
