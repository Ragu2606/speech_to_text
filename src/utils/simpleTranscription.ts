// Simple Transcription Service - Works with just Whisper (no translation needed)
// This bypasses the translation service issues

export interface SimpleTranscriptionResult {
  text: string;
  language: string;
  confidence?: number;
}

export interface SimpleTranscriptionConfig {
  whisperEndpoint: string;
}

export class SimpleTranscriptionService {
  private config: SimpleTranscriptionConfig;
  private isInitialized: boolean = false;

  constructor(config: Partial<SimpleTranscriptionConfig> = {}) {
    this.config = {
      whisperEndpoint: config.whisperEndpoint || 'http://127.0.0.1:9000',
      ...config
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('Initializing Simple Transcription Service...');
      await this.checkWhisperService();
      this.isInitialized = true;
      console.log('✅ Simple Transcription Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Simple Transcription Service:', error);
      this.isInitialized = false;
    }
  }

  private async checkWhisperService(): Promise<void> {
    const response = await fetch(`${this.config.whisperEndpoint}/health`);
    if (!response.ok) {
      throw new Error('Whisper service not available');
    }
    const data = await response.json();
    console.log('Whisper service status:', data);
  }

  /**
   * Transcribe audio to text (Whisper handles language detection and translation)
   */
  async transcribeAudio(audioBlob: Blob, language: string = 'auto'): Promise<SimpleTranscriptionResult> {
    if (!this.isInitialized) {
      throw new Error('Simple Transcription Service not initialized. Please check Whisper service.');
    }

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('language', language);
      formData.append('mode', 'accurate'); // Use accurate mode for better results

      console.log('Sending audio to Whisper for transcription...');
      const response = await fetch(`${this.config.whisperEndpoint}/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Whisper API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Transcription completed:', result);

      return {
        text: result.text || '',
        language: result.language || language,
        confidence: result.confidence || 0.8
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Transcription failed: ${errorMessage}`);
    }
  }

  /**
   * Transcribe audio and return English text (Whisper handles translation internally)
   */
  async transcribeToEnglish(audioBlob: Blob): Promise<SimpleTranscriptionResult> {
    // Whisper can translate directly to English, so we use 'auto' language detection
    return this.transcribeAudio(audioBlob, 'auto');
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      whisperEndpoint: this.config.whisperEndpoint
    };
  }

  /**
   * Manually reinitialize the service
   */
  async reinitialize(): Promise<void> {
    console.log('Reinitializing Simple Transcription Service...');
    this.isInitialized = false;
    await this.initialize();
  }
}

// Export a singleton instance
export const simpleTranscription = new SimpleTranscriptionService();

