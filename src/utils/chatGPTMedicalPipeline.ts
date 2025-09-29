// ChatGPT Medical Analysis Pipeline
// Integrates: Whisper (Speech-to-Text) -> Translation -> ChatGPT (Medical Analysis)

import { chatGPTService, initializeChatGPT } from './chatGPTService';

export interface MedicalAnalysisResult {
  originalTranscript: string;
  translatedTranscript: string;
  symptoms: string[];
  chiefComplaints: string;
  recommendedMedicines: string[];
  diagnosis: string;
  notes: string;
  confidence: number;
  summary: string;
  contentSegregation: {
    vitalSigns: string[];
    medications: string[];
    procedures: string[];
    allergies: string[];
    familyHistory: string[];
    socialHistory: string[];
  };
}

export interface PipelineConfig {
  whisperEndpoint: string;
  translationEndpoint: string;
  chatGPTApiKey: string;
  targetLanguage: string;
  chatGPTModel: string;
}

export class ChatGPTMedicalPipeline {
  private config: PipelineConfig;
  private isInitialized: boolean = false;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      whisperEndpoint: config.whisperEndpoint || 'http://127.0.0.1:9000',
      translationEndpoint: config.translationEndpoint || 'http://127.0.0.1:9001',
      chatGPTApiKey: config.chatGPTApiKey || '',
      targetLanguage: config.targetLanguage || 'en',
      chatGPTModel: config.chatGPTModel || 'gpt-4o-mini',
      ...config
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('Initializing ChatGPT Medical Analysis Pipeline...');
      console.log('Checking services:', {
        whisper: this.config.whisperEndpoint,
        translation: this.config.translationEndpoint,
        chatGPT: 'OpenAI API'
      });
      
      // Check Whisper service
      try {
        await this.checkWhisperService();
        console.log('✅ Whisper service is available');
      } catch (error) {
        console.error('❌ Whisper service check failed:', error);
        throw error;
      }
      
      // Check Translation service
      try {
        await this.checkTranslationService();
        console.log('✅ Translation service is available');
      } catch (error) {
        console.error('❌ Translation service check failed:', error);
        throw error;
      }
      
      // Initialize ChatGPT service
      try {
        if (!this.config.chatGPTApiKey) {
          throw new Error('ChatGPT API key is required');
        }
        initializeChatGPT(this.config.chatGPTApiKey);
        console.log('✅ ChatGPT service is available');
      } catch (error) {
        console.error('❌ ChatGPT service check failed:', error);
        throw error;
      }
      
      this.isInitialized = true;
      console.log('✅ ChatGPT Medical Analysis Pipeline initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ChatGPT Medical Analysis Pipeline:', error);
      this.isInitialized = false;
    }
  }

  private async checkWhisperService(): Promise<void> {
    const response = await fetch(`${this.config.whisperEndpoint}/health`);
    if (!response.ok) {
      throw new Error('Whisper service not available');
    }
  }

  private async checkTranslationService(): Promise<void> {
    const response = await fetch(`${this.config.translationEndpoint}/health`);
    if (!response.ok) {
      throw new Error('Translation service not available');
    }
  }

  /**
   * Process text directly (when transcription is already done)
   */
  async processText(transcribedText: string, _language: string = 'en'): Promise<MedicalAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('ChatGPT Medical Analysis Pipeline not initialized. Please check all services.');
    }

    try {
      console.log('Processing transcribed text with ChatGPT...');
      
      // Step 1: Translate if needed (skip if already in target language)
      console.log('Step 1: Translating transcript...');
      const translatedText = await this.translateText(transcribedText, this.config.targetLanguage);
      
      // Step 2: Medical Analysis using ChatGPT
      console.log('Step 2: Performing medical analysis with ChatGPT...');
      const medicalAnalysis = await chatGPTService!.analyzeConsultation(translatedText);
      
      // Step 3: Content Segregation using ChatGPT
      console.log('Step 3: Segregating content with ChatGPT...');
      const contentSegregation = await chatGPTService!.segregateContent(translatedText, medicalAnalysis);
      
      // Step 4: Generate Summary
      console.log('Step 4: Generating summary with ChatGPT...');
      const summary = await chatGPTService!.generateSummary(translatedText, medicalAnalysis, contentSegregation);

      return {
        originalTranscript: transcribedText,
        translatedTranscript: translatedText,
        symptoms: medicalAnalysis.symptoms,
        chiefComplaints: medicalAnalysis.chiefComplaints,
        recommendedMedicines: medicalAnalysis.recommendedMedicines,
        diagnosis: medicalAnalysis.diagnosis,
        notes: medicalAnalysis.notes,
        confidence: medicalAnalysis.confidence,
        summary,
        contentSegregation
      };
    } catch (error) {
      console.error('Error in ChatGPT text processing pipeline:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`ChatGPT text processing failed: ${errorMessage}`);
    }
  }

  /**
   * Complete pipeline: Audio -> Transcription -> Translation -> Medical Analysis -> Content Segregation
   */
  async processAudioFile(audioBlob: Blob, language: string = 'auto'): Promise<MedicalAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('ChatGPT Medical Analysis Pipeline not initialized. Please check all services.');
    }

    try {
      // Step 1: Transcribe audio using Faster Whisper
      console.log('Step 1: Transcribing audio...');
      const transcriptionResult = await this.transcribeAudio(audioBlob, language);
      
      // Step 2: Translate if needed
      console.log('Step 2: Translating transcript...');
      const translatedText = await this.translateText(transcriptionResult.text, this.config.targetLanguage);
      
      // Step 3: Medical Analysis using ChatGPT
      console.log('Step 3: Performing medical analysis with ChatGPT...');
      const medicalAnalysis = await chatGPTService!.analyzeConsultation(translatedText);
      
      // Step 4: Content Segregation using ChatGPT
      console.log('Step 4: Segregating content with ChatGPT...');
      const contentSegregation = await chatGPTService!.segregateContent(translatedText, medicalAnalysis);
      
      // Step 5: Generate Summary
      console.log('Step 5: Generating summary with ChatGPT...');
      const summary = await chatGPTService!.generateSummary(translatedText, medicalAnalysis, contentSegregation);

      return {
        originalTranscript: transcriptionResult.text,
        translatedTranscript: translatedText,
        symptoms: medicalAnalysis.symptoms,
        chiefComplaints: medicalAnalysis.chiefComplaints,
        recommendedMedicines: medicalAnalysis.recommendedMedicines,
        diagnosis: medicalAnalysis.diagnosis,
        notes: medicalAnalysis.notes,
        confidence: medicalAnalysis.confidence,
        summary,
        contentSegregation
      };
    } catch (error) {
      console.error('Error in ChatGPT medical analysis pipeline:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`ChatGPT pipeline processing failed: ${errorMessage}`);
    }
  }

  private async transcribeAudio(audioBlob: Blob, language: string): Promise<{text: string, language: string}> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('language', language);
    formData.append('mode', 'accurate'); // Use accurate mode for better results

    const response = await fetch(`${this.config.whisperEndpoint}/transcribe`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Whisper API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    return {
      text: result.text || '',
      language: result.language || language
    };
  }

  private async translateText(text: string, targetLanguage: string): Promise<string> {
    // Skip translation if already in target language
    if (targetLanguage === 'en' && this.isEnglish(text)) {
      return text;
    }

    const response = await fetch(`${this.config.translationEndpoint}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        target_language: targetLanguage
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Translation API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    return result.translated_text || text;
  }

  private isEnglish(text: string): boolean {
    // Simple heuristic to detect English text
    const englishWords = ['the', 'and', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should'];
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter(word => englishWords.includes(word)).length;
    return englishWordCount > words.length * 0.1; // If more than 10% are common English words
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      services: {
        whisper: this.isInitialized,
        translation: this.isInitialized,
        chatGPT: this.isInitialized
      }
    };
  }

  /**
   * Manually reinitialize the pipeline
   */
  async reinitialize(): Promise<void> {
    console.log('Reinitializing ChatGPT Medical Analysis Pipeline...');
    this.isInitialized = false;
    await this.initialize();
  }
}

// Export a singleton instance (will be initialized with API key)
export let chatGPTMedicalPipeline: ChatGPTMedicalPipeline | null = null;

export function initializeChatGPTMedicalPipeline(apiKey: string): ChatGPTMedicalPipeline {
  chatGPTMedicalPipeline = new ChatGPTMedicalPipeline({ chatGPTApiKey: apiKey });
  return chatGPTMedicalPipeline;
}
