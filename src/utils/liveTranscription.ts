// Live Real-time Speech-to-Text with Translation Service
// Supports continuous audio streaming and real-time transcription

export interface LiveTranscriptionResult {
  text: string;
  originalText: string;
  language: string;
  confidence: number;
  timestamp: number;
  isPartial: boolean;
  isFinal: boolean;
}

export interface LiveTranscriptionConfig {
  sourceLanguage: string;
  targetLanguage: string;
  chunkDuration: number; // in milliseconds
  overlapDuration: number; // in milliseconds
  minChunkSize: number; // minimum bytes for processing
  maxChunkSize: number; // maximum bytes for processing
  enableVAD: boolean; // Voice Activity Detection
  silenceThreshold: number; // silence duration before processing
}

export interface AudioChunk {
  data: Blob;
  timestamp: number;
  sequence: number;
}

export class LiveTranscriptionService {
  private whisperEndpoint: string;
  private translationEndpoint: string;
  private config: LiveTranscriptionConfig;
  private isInitialized: boolean = false;
  private audioChunks: AudioChunk[] = [];
  private isProcessing: boolean = false;
  private sequenceCounter: number = 0;
  private results: LiveTranscriptionResult[] = [];
  private onResultCallback?: (result: LiveTranscriptionResult) => void;
  private onErrorCallback?: (error: Error) => void;

  constructor(
    whisperEndpoint: string = 'http://127.0.0.1:9000',
    translationEndpoint: string = 'http://127.0.0.1:9001'
  ) {
    this.whisperEndpoint = whisperEndpoint;
    this.translationEndpoint = translationEndpoint;
    this.config = {
      sourceLanguage: 'gu', // Gujarati
      targetLanguage: 'en', // English
      chunkDuration: 2000, // 2 seconds (faster)
      overlapDuration: 500, // 0.5 seconds overlap
      minChunkSize: 1000, // 1KB minimum for complete audio blobs
      maxChunkSize: 1024 * 1024, // 1MB maximum
      enableVAD: true,
      silenceThreshold: 1000 // 1 second of silence
    };
    this.checkServices();
  }

  /**
   * Initialize the live transcription service
   */
  async initialize(): Promise<boolean> {
    try {
      // Use Promise.allSettled to handle individual service failures gracefully
      const [whisperResult, translationResult] = await Promise.allSettled([
        fetch(`${this.whisperEndpoint}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        }),
        fetch(`${this.translationEndpoint}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        })
      ]);

      const whisperAvailable = whisperResult.status === 'fulfilled' && whisperResult.value.ok;
      const translationAvailable = translationResult.status === 'fulfilled' && translationResult.value.ok;

      // Initialize if Whisper is available (translation is optional for English)
      this.isInitialized = whisperAvailable;
      
      if (this.isInitialized) {
        console.log('✅ Live transcription services are ready');
        console.log(`🎤 Whisper service: ${this.whisperEndpoint} ${whisperAvailable ? '✅' : '❌'}`);
        console.log(`🔄 Translation service: ${this.translationEndpoint} ${translationAvailable ? '✅' : '❌'}`);
        if (!translationAvailable) {
          console.log('⚠️ Translation service not available - English transcription only');
        }
      } else {
        console.log('❌ Live transcription services not available.');
        console.log(`   Whisper: ${whisperAvailable ? '✅' : '❌'} ${this.whisperEndpoint}`);
        console.log(`   Translation: ${translationAvailable ? '✅' : '❌'} ${this.translationEndpoint}`);
        console.log('   Please ensure both services are running for live transcription to work.');
      }
      
      return this.isInitialized;
    } catch (error) {
      console.log('❌ Live transcription services not available.');
      console.log('   Please ensure both services are running for live transcription to work.');
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Check if both Whisper and Translation services are available
   */
  private async checkServices(): Promise<void> {
    // Initialize services without throwing errors
    try {
      await this.initialize();
    } catch (error) {
      // Services not available - this is expected if services aren't running
      console.log('📝 Live transcription services not available');
    }
  }

  /**
   * Set callback for transcription results
   */
  setResultCallback(callback: (result: LiveTranscriptionResult) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * Set callback for errors
   */
  setErrorCallback(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Add audio chunk for processing
   */
  addAudioChunk(audioBlob: Blob): void {
    // Validate audio blob before adding
    if (!audioBlob) {
      console.warn('⚠️ Received null/undefined audio blob, skipping');
      return;
    }
    
    if (audioBlob.size === 0) {
      console.warn('⚠️ Received empty audio blob, skipping');
      return;
    }
    
    // Increased minimum size since we're now sending complete audio blobs
    if (audioBlob.size < 1000) {
      console.warn(`⚠️ Audio blob too small: ${audioBlob.size} bytes, skipping`);
      return;
    }
    
    // Check if blob type is valid
    if (!audioBlob.type || !audioBlob.type.startsWith('audio/')) {
      console.warn(`⚠️ Invalid audio blob type: ${audioBlob.type}, using default`);
    }
    
    const chunk: AudioChunk = {
      data: audioBlob,
      timestamp: Date.now(),
      sequence: this.sequenceCounter++
    };

    this.audioChunks.push(chunk);
    console.log(`📦 Added complete audio blob ${chunk.sequence}, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
    
    // Process immediately since we're now sending complete audio blobs
    this.processAudioChunks();
  }

  /**
   * Process accumulated audio chunks
   */
  private async processAudioChunks(): Promise<void> {
    if (this.isProcessing || this.audioChunks.length === 0) {
      return;
    }

    // Since we're now sending complete audio blobs, process the latest one
    const latestChunk = this.audioChunks[this.audioChunks.length - 1];
    
    if (!latestChunk || latestChunk.data.size < this.config.minChunkSize) {
      console.log(`⚠️ Latest chunk too small: ${latestChunk?.data.size || 0} bytes (min: ${this.config.minChunkSize})`);
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing latest complete audio blob: ${latestChunk.data.size} bytes`);

    try {
      // Process the latest complete audio blob directly
      const result = await this.processAudioBlob(latestChunk.data);
      
      if (result) {
        console.log(`✅ Transcription result: "${result.text}"`);
        this.results.push(result);
        if (this.onResultCallback) {
          this.onResultCallback(result);
        }
      }

      // Keep only the latest chunk to avoid memory buildup
      this.audioChunks = [latestChunk];
      
    } catch (error) {
      console.error('Error processing audio blob:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
    } finally {
      this.isProcessing = false;
    }
  }




  /**
   * Process a single audio blob
   */
  private async processAudioBlob(audioBlob: Blob): Promise<LiveTranscriptionResult | null> {
    if (!this.isInitialized) {
      // Services not available - throw error instead of returning null
      throw new Error('Live transcription services are not available. Please ensure Whisper and Translation services are running.');
    }

    try {
      console.log('🎤 Processing real audio blob:', audioBlob.size, 'bytes');
      
      // Step 1: Transcribe audio to text
      const originalText = await this.transcribeAudio(audioBlob);
      
      if (!originalText || originalText.trim().length === 0) {
        console.log('⚠️ No speech detected in audio chunk');
        return null;
      }

      console.log('📝 Transcribed text:', originalText);

      // Step 2: Check if translation is needed
      // If the text is already in English, skip translation
      const isEnglish = this.isEnglishText(originalText);
      let translatedText = originalText;
      
      if (!isEnglish) {
        // Only translate if not English and translation service is available
        try {
          translatedText = await this.translateText(
            originalText, 
            this.config.sourceLanguage, 
            this.config.targetLanguage
          );
          console.log('🔄 Translated text:', translatedText);
        } catch (error) {
          console.log('⚠️ Translation failed, using original text:', error);
          translatedText = originalText;
        }
      } else {
        console.log('✅ Text is already in English, skipping translation');
      }

      return {
        text: translatedText,
        originalText: originalText,
        language: isEnglish ? 'en' : this.config.sourceLanguage,
        confidence: 0.85,
        timestamp: Date.now(),
        isPartial: false,
        isFinal: true
      };

    } catch (error) {
      console.error('Error processing audio blob:', error);
      console.log('❌ Transcription failed, skipping this chunk');
      
      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('500')) {
          console.log('🔧 Server error - check Whisper service logs');
        } else if (error.message.includes('Failed to fetch')) {
          console.log('🌐 Network error - check if Whisper service is running');
        } else {
          console.log('⚠️ Audio processing error:', error.message);
        }
      }
      
      return null;
    }
  }

  /**
   * Transcribe audio using Whisper model
   */
  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    // Validate audio blob before processing
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Invalid audio blob: empty or null');
    }
    
    if (audioBlob.size < 100) {
      throw new Error(`Audio blob too small: ${audioBlob.size} bytes (minimum 100 bytes)`);
    }
    
    const formData = new FormData();
    
    // Determine file extension and content type based on blob type
    let filename = 'audio.webm';
    let contentType = 'audio/webm';
    
    if (audioBlob.type.includes('webm')) {
      filename = 'audio.webm';
      contentType = 'audio/webm';
    } else if (audioBlob.type.includes('mp4')) {
      filename = 'audio.mp4';
      contentType = 'audio/mp4';
    } else if (audioBlob.type.includes('wav')) {
      filename = 'audio.wav';
      contentType = 'audio/wav';
    } else if (audioBlob.type.includes('ogg')) {
      filename = 'audio.ogg';
      contentType = 'audio/ogg';
    } else {
      // Default to webm for browser audio
      filename = 'audio.webm';
      contentType = 'audio/webm';
    }
    
    // Create a new blob with explicit content type and validate
    const typedBlob = new Blob([audioBlob], { type: contentType });
    
    // Additional validation: check if the blob is actually readable
    try {
      const arrayBuffer = await typedBlob.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Audio blob contains no data');
      }
      console.log(`✅ Audio blob validation passed: ${arrayBuffer.byteLength} bytes`);
    } catch (error) {
      throw new Error(`Audio blob validation failed: ${error}`);
    }
    
    formData.append('audio', typedBlob, filename);
    formData.append('language', 'auto');

    console.log(`🎤 Sending audio to Whisper: ${filename}, size: ${audioBlob.size} bytes, type: ${contentType}`);
    console.log(`🎤 Original blob type: ${audioBlob.type}`);
    console.log(`🎤 FormData contents:`, Array.from(formData.entries()));

    const response = await fetch(`${this.whisperEndpoint}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Whisper API error: ${response.status} - ${errorText}`);
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`📝 Whisper response:`, data);
    return data.text || '';
  }

  /**
   * Check if text is in English (simple heuristic)
   */
  private isEnglishText(text: string): boolean {
    // Simple heuristic: if text contains mostly Latin characters and common English words
    const englishWords = ['the', 'and', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall', 'do', 'does', 'did', 'be', 'been', 'being', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over', 'around', 'near', 'far', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who', 'which', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
    
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter(word => englishWords.includes(word)).length;
    const totalWords = words.length;
    
    // If more than 30% of words are English words, consider it English
    return totalWords > 0 && (englishWordCount / totalWords) > 0.3;
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
        model: 'opus-mt-mul-en'
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
  updateConfig(config: Partial<LiveTranscriptionConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Updated live transcription config:', this.config);
  }

  /**
   * Get all transcription results
   */
  getResults(): LiveTranscriptionResult[] {
    return [...this.results];
  }

  /**
   * Get the latest transcription result
   */
  getLatestResult(): LiveTranscriptionResult | null {
    return this.results.length > 0 ? this.results[this.results.length - 1] : null;
  }

  /**
   * Clear all results and reset state
   */
  clearResults(): void {
    this.results = [];
    this.audioChunks = [];
    this.sequenceCounter = 0;
  }

  /**
   * Check if service is ready
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

  /**
   * Force process any pending chunks
   */
  async flushPendingChunks(): Promise<void> {
    if (this.audioChunks.length > 0) {
      await this.processAudioChunks();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LiveTranscriptionConfig {
    return { ...this.config };
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
   * Check if real audio processing is available
   */
  canProcessRealAudio(): boolean {
    return this.isInitialized;
  }

  /**
   * Get processing mode information
   */
  getProcessingMode(): {
    mode: 'real' | 'unavailable';
    servicesAvailable: boolean;
    description: string;
  } {
    if (this.isInitialized) {
      return {
        mode: 'real',
        servicesAvailable: true,
        description: 'Real audio processing with Whisper service'
      };
    } else {
      return {
        mode: 'unavailable',
        servicesAvailable: false,
        description: 'Services not available - transcription disabled'
      };
    }
  }

  /**
   * Get service status for debugging
   */
  getDebugStatus(): { isInitialized: boolean; whisperEndpoint: string; translationEndpoint: string } {
    return {
      isInitialized: this.isInitialized,
      whisperEndpoint: this.whisperEndpoint,
      translationEndpoint: this.translationEndpoint
    };
  }
}

// Export singleton instance
export const liveTranscription = new LiveTranscriptionService();
