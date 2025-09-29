// Multilingual Speech-to-Text with Translation Service
// Supports Gujarati to English transcription using offline models
// Now includes live streaming support

export interface TranscriptionResult {
  originalText: string;
  translatedText: string;
  language: string;
  confidence: number;
  timestamp: number;
}

export interface StreamingTranscriptionResult {
  text: string;
  originalText: string;
  language: string;
  confidence: number;
  timestamp: number;
  isPartial: boolean;
  isFinal: boolean;
}

export interface TranscriptionConfig {
  sourceLanguage: string;
  targetLanguage: string;
  modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  translationModel: string;
}

export class MultilingualTranscriptionService {
  private whisperEndpoint: string;
  private translationEndpoint: string;
  private config: TranscriptionConfig;
  private isInitialized: boolean = false;
  private streamingResults: StreamingTranscriptionResult[] = [];
  private onStreamingResultCallback?: (result: StreamingTranscriptionResult) => void;

  constructor(
    whisperEndpoint: string = 'http://127.0.0.1:9000',
    translationEndpoint: string = 'http://127.0.0.1:9001'
  ) {
    this.whisperEndpoint = whisperEndpoint;
    this.translationEndpoint = translationEndpoint;
    this.config = {
      sourceLanguage: 'gu', // Gujarati
      targetLanguage: 'en', // English
      modelSize: 'medium',
      translationModel: 'opus-mt-mul-en'
    };
    this.checkServices();
  }

  /**
   * Check if both Whisper and Translation services are available
   */
  private async checkServices(): Promise<void> {
    try {
      const [whisperResult, translationResult] = await Promise.allSettled([
        fetch(`${this.whisperEndpoint}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        }),
        fetch(`${this.translationEndpoint}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        })
      ]);

      const whisperAvailable = whisperResult.status === 'fulfilled' && whisperResult.value.ok;
      const translationAvailable = translationResult.status === 'fulfilled' && translationResult.value.ok;

      this.isInitialized = whisperAvailable && translationAvailable;
      
      if (this.isInitialized) {
        console.log('✅ Multilingual transcription services are ready');
        console.log(`🎤 Whisper service: ${this.whisperEndpoint}`);
        console.log(`🔄 Translation service: ${this.translationEndpoint}`);
      } else {
        console.log('❌ Transcription services not available.');
        console.log(`   Whisper: ${whisperAvailable ? '✅' : '❌'} ${this.whisperEndpoint}`);
        console.log(`   Translation: ${translationAvailable ? '✅' : '❌'} ${this.translationEndpoint}`);
        console.log('   Please ensure both services are running for transcription to work.');
      }
    } catch (error) {
      console.log('❌ Transcription services not available.');
      console.log('   Please ensure both services are running for transcription to work.');
      this.isInitialized = false;
    }
  }

  /**
   * Transcribe Gujarati audio to English text
   */
  async transcribeGujaratiToEnglish(audioBlob: Blob): Promise<TranscriptionResult> {
    if (!this.isInitialized) {
      throw new Error('Transcription services are not available. Please ensure Whisper and Translation services are running.');
    }

    try {
      // Step 1: Transcribe Gujarati audio to Gujarati text using Whisper
      const gujaratiText = await this.transcribeAudio(audioBlob, 'gu');
      
      // Step 2: Translate Gujarati text to English
      const englishText = await this.translateText(gujaratiText, 'gu', 'en');

      return {
        originalText: gujaratiText,
        translatedText: englishText,
        language: 'gu',
        confidence: 0.85,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transcribe audio using Whisper model
   */
  private async transcribeAudio(audioBlob: Blob, language: string): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');
    formData.append('language', language);

    const response = await fetch(`${this.whisperEndpoint}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.text || '';
  }

  /**
   * Translate text using local translation model
   */
  private async translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const response = await fetch(`${this.translationEndpoint}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        source_language: sourceLang,
        target_language: targetLang,
        model: this.config.translationModel
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translated_text || text;
  }

  /**
   * Update transcription configuration
   */
  updateConfig(config: Partial<TranscriptionConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Updated transcription config:', this.config);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
      { code: 'hi', name: 'Hindi (हिन्दी)' },
      { code: 'en', name: 'English' },
      { code: 'mr', name: 'Marathi (मराठी)' },
      { code: 'bn', name: 'Bengali (বাংলা)' },
      { code: 'ta', name: 'Tamil (தமிழ்)' },
      { code: 'te', name: 'Telugu (తెలుగు)' },
      { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
      { code: 'ml', name: 'Malayalam (മലയാളം)' },
      { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
      { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' },
      { code: 'as', name: 'Assamese (অসমীয়া)' },
      { code: 'ur', name: 'Urdu (اردو)' },
    ];
  }


  /**
   * Process real-time audio stream (for live transcription)
   */
  async processAudioStream(audioChunk: Blob): Promise<string> {
    try {
      const result = await this.transcribeGujaratiToEnglish(audioChunk);
      return result.translatedText;
    } catch (error) {
      console.error('Stream processing failed:', error);
      return 'Processing...';
    }
  }

  /**
   * Start live streaming transcription
   */
  async startLiveTranscription(
    onResult: (result: StreamingTranscriptionResult) => void
  ): Promise<void> {
    this.onStreamingResultCallback = onResult;
    this.streamingResults = [];
    console.log('🎤 Live transcription started');
  }

  /**
   * Process audio chunk for live streaming
   */
  async processLiveAudioChunk(audioChunk: Blob): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Transcription services are not available. Please ensure Whisper and Translation services are running.');
    }

    try {
      // Process with real services
      const result = await this.transcribeGujaratiToEnglish(audioChunk);
      
      const streamingResult: StreamingTranscriptionResult = {
        text: result.translatedText,
        originalText: result.originalText,
        language: result.language,
        confidence: result.confidence,
        timestamp: result.timestamp,
        isPartial: false,
        isFinal: true
      };

      this.streamingResults.push(streamingResult);
      
      if (this.onStreamingResultCallback) {
        this.onStreamingResultCallback(streamingResult);
      }
    } catch (error) {
      console.error('Live transcription chunk processing failed:', error);
      throw new Error(`Live transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop live streaming transcription
   */
  stopLiveTranscription(): void {
    this.onStreamingResultCallback = undefined;
    console.log('🛑 Live transcription stopped');
  }

  /**
   * Get streaming results
   */
  getStreamingResults(): StreamingTranscriptionResult[] {
    return [...this.streamingResults];
  }

  /**
   * Clear streaming results
   */
  clearStreamingResults(): void {
    this.streamingResults = [];
  }


  /**
   * Check if services are ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<{
    whisper: boolean;
    translation: boolean;
    overall: boolean;
  }> {
    try {
      const [whisperResult, translationResult] = await Promise.allSettled([
        fetch(`${this.whisperEndpoint}/health`, { 
          signal: AbortSignal.timeout(2000) 
        }).then(r => r.ok),
        fetch(`${this.translationEndpoint}/health`, { 
          signal: AbortSignal.timeout(2000) 
        }).then(r => r.ok)
      ]);

      const whisperAvailable = whisperResult.status === 'fulfilled' && whisperResult.value;
      const translationAvailable = translationResult.status === 'fulfilled' && translationResult.value;

      return {
        whisper: whisperAvailable,
        translation: translationAvailable,
        overall: whisperAvailable && translationAvailable
      };
    } catch {
      return {
        whisper: false,
        translation: false,
        overall: false
      };
    }
  }
}

// Export singleton instance
export const multilingualTranscription = new MultilingualTranscriptionService();

// Backward compatibility export
export const gujaratiTranscription = multilingualTranscription;
