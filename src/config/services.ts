// Service Configuration for HTTPS Deployment
// All services now use HTTPS for secure communication

export const SERVICE_CONFIG = {
  // VM IP address - update this to your VM's IP
  VM_IP: '48.216.181.122',
  
  // HTTPS Service endpoints (via Nginx reverse proxy)
  WHISPER_ENDPOINT: 'https://localhost:443/api/whisper',
  TRANSLATION_ENDPOINT: 'https://localhost:443/api/translation', 
  OLLAMA_ENDPOINT: 'https://48.216.181.122:11434', // External Ollama service
  
  // Local development endpoints (HTTPS)
  LOCAL_WHISPER_ENDPOINT: 'https://localhost:443/api/whisper',
  LOCAL_TRANSLATION_ENDPOINT: 'https://localhost:443/api/translation',
  LOCAL_OLLAMA_ENDPOINT: 'https://localhost:11434',
  
  // Direct service endpoints (for internal use)
  DIRECT_WHISPER_ENDPOINT: 'https://localhost:9000',
  DIRECT_TRANSLATION_ENDPOINT: 'https://localhost:9001',
};

// Function to get the appropriate endpoint based on environment
export const getServiceEndpoint = (service: 'whisper' | 'translation' | 'ollama', useLocal: boolean = false) => {
  if (useLocal) {
    switch (service) {
      case 'whisper': return SERVICE_CONFIG.LOCAL_WHISPER_ENDPOINT;
      case 'translation': return SERVICE_CONFIG.LOCAL_TRANSLATION_ENDPOINT;
      case 'ollama': return SERVICE_CONFIG.LOCAL_OLLAMA_ENDPOINT;
    }
  }
  
  switch (service) {
    case 'whisper': return SERVICE_CONFIG.WHISPER_ENDPOINT;
    case 'translation': return SERVICE_CONFIG.TRANSLATION_ENDPOINT;
    case 'ollama': return SERVICE_CONFIG.OLLAMA_ENDPOINT;
  }
};

// Function to get direct service endpoint (bypassing Nginx)
export const getDirectServiceEndpoint = (service: 'whisper' | 'translation') => {
  switch (service) {
    case 'whisper': return SERVICE_CONFIG.DIRECT_WHISPER_ENDPOINT;
    case 'translation': return SERVICE_CONFIG.DIRECT_TRANSLATION_ENDPOINT;
  }
};

// Check if we're running in a VM environment
export const isVMEnvironment = () => {
  return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
};
