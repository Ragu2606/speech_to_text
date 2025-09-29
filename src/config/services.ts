// Service Configuration for VM Deployment
// Update these URLs based on your VM's IP address

export const SERVICE_CONFIG = {
  // VM IP address - update this to your VM's IP
  VM_IP: '48.216.181.122',
  
  // Service endpoints
  WHISPER_ENDPOINT: 'http://48.216.181.122:9000',
  TRANSLATION_ENDPOINT: 'http://48.216.181.122:9001', 
  OLLAMA_ENDPOINT: 'http://48.216.181.122:11434',
  
  // Local development endpoints (fallback)
  LOCAL_WHISPER_ENDPOINT: 'http://127.0.0.1:9000',
  LOCAL_TRANSLATION_ENDPOINT: 'http://127.0.0.1:9001',
  LOCAL_OLLAMA_ENDPOINT: 'http://127.0.0.1:11434',
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

// Check if we're running in a VM environment
export const isVMEnvironment = () => {
  return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
};
