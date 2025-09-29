// Whisper Transcription Service for Hindi/Gujarati Audio
// This service provides real transcription capabilities using Whisper API

export interface WhisperTranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  originalText?: string;
  translatedText?: string;
}

export interface WhisperConfig {
  endpoint: string;
  model: string;
  language?: string;
}

export class WhisperTranscriptionService {
  private config: WhisperConfig;
  private isInitialized: boolean = false;

  constructor(config: Partial<WhisperConfig> = {}) {
    this.config = {
      endpoint: config.endpoint || 'http://127.0.0.1:9000',
      model: config.model || 'whisper-1',
      language: config.language || 'auto',
      ...config
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🎤 Initializing Whisper Transcription Service...');
      await this.checkWhisperService();
      this.isInitialized = true;
      console.log('✅ Whisper Transcription Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Whisper Transcription Service:', error);
      this.isInitialized = false;
    }
  }

  private async checkWhisperService(): Promise<void> {
    try {
      const response = await fetch(`${this.config.endpoint}/health`);
      if (!response.ok) {
        throw new Error('Whisper service not available');
      }
      const data = await response.json();
      console.log('🎯 Whisper service status:', data);
    } catch (error) {
      throw new Error(`Whisper service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transcribe Hindi/Gujarati audio to English text
   */
  async transcribeHindiToEnglish(audioBlob: Blob): Promise<WhisperTranscriptionResult> {
    return this.transcribeAudio(audioBlob, 'hi', 'en');
  }

  /**
   * Transcribe Gujarati audio to English text
   */
  async transcribeGujaratiToEnglish(audioBlob: Blob): Promise<WhisperTranscriptionResult> {
    return this.transcribeAudio(audioBlob, 'gu', 'en');
  }

  /**
   * Transcribe audio with automatic language detection
   */
  async transcribeWithAutoDetection(audioBlob: Blob): Promise<WhisperTranscriptionResult> {
    return this.transcribeAudio(audioBlob, 'auto', 'en');
  }

  /**
   * Core transcription method
   */
  private async transcribeAudio(
    audioBlob: Blob, 
    sourceLanguage: string = 'auto', 
    targetLanguage: string = 'en'
  ): Promise<WhisperTranscriptionResult> {
    if (!this.isInitialized) {
      throw new Error('Whisper Transcription Service not initialized. Please check Whisper service.');
    }

    try {
      console.log(`🎤 Transcribing audio: ${sourceLanguage} → ${targetLanguage}`);
      console.log(`📊 Audio size: ${audioBlob.size} bytes`);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('language', sourceLanguage);
      formData.append('target_language', targetLanguage);
      formData.append('mode', 'accurate'); // Use accurate mode for better results
      formData.append('translate', 'true'); // Enable translation

      const response = await fetch(`${this.config.endpoint}/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Whisper API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ Transcription completed:', result);

      return {
        text: result.translated_text || result.text || '',
        language: result.language || sourceLanguage,
        confidence: result.confidence || 0.8,
        originalText: result.text || '',
        translatedText: result.translated_text || ''
      };
    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Transcription failed: ${errorMessage}`);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      endpoint: this.config.endpoint,
      model: this.config.model,
      language: this.config.language
    };
  }

  /**
   * Manually reinitialize the service
   */
  async reinitialize(): Promise<void> {
    console.log('🔄 Reinitializing Whisper Transcription Service...');
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * Check if service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      await this.checkWhisperService();
      return true;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const whisperTranscription = new WhisperTranscriptionService();
