// Simple ChatGPT Medical Analysis Pipeline
// Only requires Whisper service (no translation service needed)

import { chatGPTService, initializeChatGPT } from './chatGPTService';

export interface SimpleMedicalAnalysisResult {
  originalTranscript: string;
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

export interface SimplePipelineConfig {
  whisperEndpoint: string;
  chatGPTApiKey: string;
  chatGPTModel: string;
}

export class SimpleChatGPTPipeline {
  private config: SimplePipelineConfig;
  private isInitialized: boolean = false;

  constructor(config: Partial<SimplePipelineConfig> = {}) {
    this.config = {
      whisperEndpoint: config.whisperEndpoint || 'http://127.0.0.1:9000',
      chatGPTApiKey: config.chatGPTApiKey || '',
      chatGPTModel: config.chatGPTModel || 'gpt-4o-mini',
      ...config
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('Initializing Simple ChatGPT Medical Analysis Pipeline...');
      console.log('Checking services:', {
        whisper: this.config.whisperEndpoint,
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
      console.log('✅ Simple ChatGPT Medical Analysis Pipeline initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Simple ChatGPT Medical Analysis Pipeline:', error);
      this.isInitialized = false;
    }
  }

  private async checkWhisperService(): Promise<void> {
    const response = await fetch(`${this.config.whisperEndpoint}/health`);
    if (!response.ok) {
      throw new Error('Whisper service not available');
    }
  }

  /**
   * Process text directly (when transcription is already done)
   */
  async processText(transcribedText: string): Promise<SimpleMedicalAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Simple ChatGPT Medical Analysis Pipeline not initialized. Please check all services.');
    }

    try {
      console.log('Processing transcribed text with ChatGPT...');
      
      // Step 1: Medical Analysis using ChatGPT
      console.log('Step 1: Performing medical analysis with ChatGPT...');
      const medicalAnalysis = await chatGPTService!.analyzeConsultation(transcribedText);
      
      // Step 2: Content Segregation using ChatGPT
      console.log('Step 2: Segregating content with ChatGPT...');
      const contentSegregation = await chatGPTService!.segregateContent(transcribedText, medicalAnalysis);
      
      // Step 3: Generate Summary
      console.log('Step 3: Generating summary with ChatGPT...');
      const summary = await chatGPTService!.generateSummary(transcribedText, medicalAnalysis, contentSegregation);

      return {
        originalTranscript: transcribedText,
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
      console.error('Error in Simple ChatGPT text processing pipeline:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Simple ChatGPT text processing failed: ${errorMessage}`);
    }
  }

  /**
   * Complete pipeline: Audio -> Transcription -> Medical Analysis -> Content Segregation
   */
  async processAudioFile(audioBlob: Blob, language: string = 'auto'): Promise<SimpleMedicalAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Simple ChatGPT Medical Analysis Pipeline not initialized. Please check all services.');
    }

    try {
      // Step 1: Transcribe audio using Faster Whisper
      console.log('Step 1: Transcribing audio...');
      const transcriptionResult = await this.transcribeAudio(audioBlob, language);
      
      // Step 2: Medical Analysis using ChatGPT
      console.log('Step 2: Performing medical analysis with ChatGPT...');
      const medicalAnalysis = await chatGPTService!.analyzeConsultation(transcriptionResult.text);
      
      // Step 3: Content Segregation using ChatGPT
      console.log('Step 3: Segregating content with ChatGPT...');
      const contentSegregation = await chatGPTService!.segregateContent(transcriptionResult.text, medicalAnalysis);
      
      // Step 4: Generate Summary
      console.log('Step 4: Generating summary with ChatGPT...');
      const summary = await chatGPTService!.generateSummary(transcriptionResult.text, medicalAnalysis, contentSegregation);

      return {
        originalTranscript: transcriptionResult.text,
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
      console.error('Error in Simple ChatGPT medical analysis pipeline:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Simple ChatGPT pipeline processing failed: ${errorMessage}`);
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

  getStatus() {
    return {
      initialized: this.isInitialized,
      services: {
        whisper: this.isInitialized,
        chatGPT: this.isInitialized
      }
    };
  }

  /**
   * Manually reinitialize the pipeline
   */
  async reinitialize(): Promise<void> {
    console.log('Reinitializing Simple ChatGPT Medical Analysis Pipeline...');
    this.isInitialized = false;
    await this.initialize();
  }
}

// Export a singleton instance (will be initialized with API key)
export let simpleChatGPTPipeline: SimpleChatGPTPipeline | null = null;

export function initializeSimpleChatGPTPipeline(apiKey: string): SimpleChatGPTPipeline {
  simpleChatGPTPipeline = new SimpleChatGPTPipeline({ chatGPTApiKey: apiKey });
  return simpleChatGPTPipeline;
}

