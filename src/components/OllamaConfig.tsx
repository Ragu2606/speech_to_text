import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { localLLM } from '../utils/localLLM';
import { getServiceEndpoint, isVMEnvironment } from '../config/services';

interface OllamaConfigProps {
  onConfigured: () => void;
}

const OllamaConfig: React.FC<OllamaConfigProps> = ({ onConfigured }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check Ollama connection on component mount
  useEffect(() => {
    checkOllamaConnection();
  }, []);

  const checkOllamaConnection = async () => {
    setIsLoading(true);
    setError('');
    setSuccess(false);
    setOllamaStatus('checking');

    try {
      // Test connection to Ollama
      const response = await fetch('https://:11434/api/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Ollama models available:', data);
        
        // Check if we have a suitable model (llama3.2 or similar)
        const hasSuitableModel = data.models && data.models.some((model: any) => 
          model.name.includes('llama3.2') || model.name.includes('llama3') || model.name.includes('llama')
        );

        if (hasSuitableModel) {
          setOllamaStatus('connected');
          setSuccess(true);
          // Store configuration in localStorage
          localStorage.setItem('ollama_configured', 'true');
          setTimeout(() => {
            onConfigured();
          }, 1500);
        } else {
          setOllamaStatus('disconnected');
          setError('No suitable models found. Please install llama3.2 or similar model in Ollama.');
        }
      } else {
        setOllamaStatus('disconnected');
        setError('Ollama service is not running. Please start Ollama service.');
      }
    } catch (error) {
      console.error('Ollama connection error:', error);
      setOllamaStatus('disconnected');
      const ollamaUrl = getServiceEndpoint('ollama', !isVMEnvironment());
      setError(`Cannot connect to Ollama service. Please ensure Ollama is running on ${ollamaUrl}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    checkOllamaConnection();
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
            <Server className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ollama Configuration</h1>
          <p className="text-gray-600">
            Connect to your local Ollama service for medical analysis
          </p>
        </div>

        <div className="space-y-4">
          {/* Status Display */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Ollama Status:</span>
              <div className="flex items-center space-x-2">
                {ollamaStatus === 'checking' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-600">Checking...</span>
                  </>
                )}
                {ollamaStatus === 'connected' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Connected</span>
                  </>
                )}
                {ollamaStatus === 'disconnected' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">Disconnected</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Service: {getServiceEndpoint('ollama', !isVMEnvironment())}
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
              <span className="text-green-700 text-sm">Ollama configured successfully!</span>
            </motion.div>
          )}

          <button
            onClick={handleRetry}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Connection...</span>
              </>
            ) : (
              <>
                <Server className="w-4 h-4" />
                <span>Check Ollama Connection</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">How to set up Ollama:</h3>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ollama.ai</a></li>
            <li>2. Start Ollama service</li>
            <li>3. Pull a model: <code className="bg-gray-200 px-1 rounded">ollama pull llama3.2</code></li>
            <li>4. Ensure Ollama is running on {getServiceEndpoint('ollama', !isVMEnvironment())}</li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
};

export default OllamaConfig;
