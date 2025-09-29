// Real-time Transcription Service
// Connects to the Python real-time transcription service

export interface RealtimeTranscriptionConfig {
  endpoint: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface TranscriptionResult {
  text: string;
  timestamp: number;
  confidence: number;
}

export class RealtimeTranscriptionService {
  private config: RealtimeTranscriptionConfig;
  private isInitialized: boolean = false;
  private isRecording: boolean = false;
  private eventSource: EventSource | null = null;
  private reconnectAttempts: number = 0;
  private transcriptionCallback: ((result: TranscriptionResult) => void) | null = null;

  constructor(config: Partial<RealtimeTranscriptionConfig> = {}) {
    this.config = {
      endpoint: config.endpoint || 'http://127.0.0.1:9002',
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      ...config
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('Initializing Real-time Transcription Service...');
      await this.checkService();
      this.isInitialized = true;
      console.log('✅ Real-time Transcription Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Real-time Transcription Service:', error);
      this.isInitialized = false;
    }
  }

  private async checkService(): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/health`);
    if (!response.ok) {
      throw new Error('Real-time transcription service not available');
    }
    const data = await response.json();
    console.log('Real-time transcription service status:', data);
  }

  /**
   * Start real-time transcription
   */
  async startTranscription(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Real-time Transcription Service not initialized');
    }

    if (this.isRecording) {
      console.log('Transcription already in progress');
      return;
    }

    try {
      // Start the transcription service
      const response = await fetch(`${this.config.endpoint}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to start transcription: ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Transcription started:', result);

      // Start listening to the SSE stream
      this.startEventStream();
      this.isRecording = true;
      this.reconnectAttempts = 0;

    } catch (error) {
      console.error('Error starting transcription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to start real-time transcription: ${errorMessage}`);
    }
  }

  /**
   * Stop real-time transcription
   */
  async stopTranscription(): Promise<void> {
    if (!this.isRecording) {
      console.log('No transcription in progress');
      return;
    }

    try {
      // Stop the event stream
      this.stopEventStream();

      // Stop the transcription service
      const response = await fetch(`${this.config.endpoint}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to stop transcription: ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Transcription stopped:', result);
      this.isRecording = false;

    } catch (error) {
      console.error('Error stopping transcription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to stop real-time transcription: ${errorMessage}`);
    }
  }

  /**
   * Get all transcriptions
   */
  async getTranscriptions(sinceTimestamp?: number): Promise<TranscriptionResult[]> {
    if (!this.isInitialized) {
      throw new Error('Real-time Transcription Service not initialized');
    }

    try {
      const url = sinceTimestamp 
        ? `${this.config.endpoint}/transcriptions?since=${sinceTimestamp}`
        : `${this.config.endpoint}/transcriptions`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to get transcriptions');
      }

      const data = await response.json();
      return data.transcriptions || [];

    } catch (error) {
      console.error('Error getting transcriptions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get transcriptions: ${errorMessage}`);
    }
  }

  /**
   * Get the latest transcription
   */
  async getLatestTranscription(): Promise<TranscriptionResult | null> {
    if (!this.isInitialized) {
      throw new Error('Real-time Transcription Service not initialized');
    }

    try {
      const response = await fetch(`${this.config.endpoint}/latest`);
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.message ? null : data;

    } catch (error) {
      console.error('Error getting latest transcription:', error);
      return null;
    }
  }

  /**
   * Clear all transcriptions
   */
  async clearTranscriptions(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Real-time Transcription Service not initialized');
    }

    try {
      const response = await fetch(`${this.config.endpoint}/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear transcriptions');
      }

      console.log('Transcriptions cleared');

    } catch (error) {
      console.error('Error clearing transcriptions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to clear transcriptions: ${errorMessage}`);
    }
  }

  /**
   * Set callback for real-time transcription results
   */
  setTranscriptionCallback(callback: (result: TranscriptionResult) => void): void {
    this.transcriptionCallback = callback;
  }

  /**
   * Start listening to the Server-Sent Events stream
   */
  private startEventStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`${this.config.endpoint}/stream`);
    
    this.eventSource.onmessage = (event) => {
      try {
        const transcription: TranscriptionResult = JSON.parse(event.data);
        if (this.transcriptionCallback) {
          this.transcriptionCallback(transcription);
        }
      } catch (error) {
        console.error('Error parsing transcription data:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      this.handleReconnect();
    };

    this.eventSource.onopen = () => {
      console.log('Real-time transcription stream connected');
      this.reconnectAttempts = 0;
    };
  }

  /**
   * Stop the event stream
   */
  private stopEventStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Handle reconnection to the event stream
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.stopEventStream();
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.isRecording) {
        this.startEventStream();
      }
    }, this.config.reconnectInterval);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      recording: this.isRecording,
      endpoint: this.config.endpoint
    };
  }

  /**
   * Manually reinitialize the service
   */
  async reinitialize(): Promise<void> {
    console.log('Reinitializing Real-time Transcription Service...');
    this.isInitialized = false;
    await this.initialize();
  }
}

// Export a singleton instance
export const realtimeTranscription = new RealtimeTranscriptionService();

