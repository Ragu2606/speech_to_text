// Medical Analysis Pipeline Service
// Integrates: Whisper (Speech-to-Text) -> Translation -> Ollama (Content Segregation)

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
  ollamaEndpoint: string;
  targetLanguage: string;
  ollamaModel: string;
}

export class MedicalAnalysisPipeline {
  private config: PipelineConfig;
  private isInitialized: boolean = false;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      whisperEndpoint: config.whisperEndpoint || 'http://127.0.0.1:9000',
      translationEndpoint: config.translationEndpoint || 'http://127.0.0.1:9001',
      ollamaEndpoint: config.ollamaEndpoint || 'http://localhost:11434',
      targetLanguage: config.targetLanguage || 'en',
      ollamaModel: config.ollamaModel || 'llama3.2:latest',
      ...config
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('Initializing Medical Analysis Pipeline...');
      console.log('Checking services:', {
        whisper: this.config.whisperEndpoint,
        translation: this.config.translationEndpoint,
        ollama: this.config.ollamaEndpoint
      });
      
      // Check all services individually for better error reporting
      try {
        await this.checkWhisperService();
        console.log('✅ Whisper service is available');
      } catch (error) {
        console.error('❌ Whisper service check failed:', error);
        throw error;
      }
      
      try {
        await this.checkTranslationService();
        console.log('✅ Translation service is available');
      } catch (error) {
        console.error('❌ Translation service check failed:', error);
        throw error;
      }
      
      try {
        await this.checkOllamaService();
        console.log('✅ Ollama service is available');
      } catch (error) {
        console.error('❌ Ollama service check failed:', error);
        throw error;
      }
      
      this.isInitialized = true;
      console.log('✅ Medical Analysis Pipeline initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Medical Analysis Pipeline:', error);
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

  private async checkOllamaService(): Promise<void> {
    const response = await fetch(`${this.config.ollamaEndpoint}/api/tags`);
    if (!response.ok) {
      throw new Error('Ollama service not available');
    }
  }

  /**
   * Process text directly (when transcription is already done)
   */
  async processText(transcribedText: string, _language: string = 'en'): Promise<MedicalAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Medical Analysis Pipeline not initialized. Please check all services.');
    }

    try {
      console.log('Processing transcribed text directly...');
      
      // Step 1: Translate if needed (skip if already in target language)
      console.log('Step 1: Translating transcript...');
      const translatedText = await this.translateText(transcribedText, this.config.targetLanguage);
      
      // Step 2: Medical Analysis using Ollama
      console.log('Step 2: Performing medical analysis...');
      const medicalAnalysis = await this.performMedicalAnalysis(translatedText);
      
      // Step 3: Content Segregation using Ollama
      console.log('Step 3: Segregating content...');
      const contentSegregation = await this.segregateContent(translatedText, medicalAnalysis);
      
      // Step 4: Generate Summary
      console.log('Step 4: Generating summary...');
      const summary = await this.generateSummary(translatedText, medicalAnalysis, contentSegregation);

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
      console.error('Error in text processing pipeline:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Text processing failed: ${errorMessage}`);
    }
  }

  /**
   * Complete pipeline: Audio -> Transcription -> Translation -> Medical Analysis -> Content Segregation
   */
  async processAudioFile(audioBlob: Blob, language: string = 'auto'): Promise<MedicalAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Medical Analysis Pipeline not initialized. Please check all services.');
    }

    try {
      // Step 1: Transcribe audio using Faster Whisper
      console.log('Step 1: Transcribing audio...');
      const transcriptionResult = await this.transcribeAudio(audioBlob, language);
      
      // Step 2: Translate if needed
      console.log('Step 2: Translating transcript...');
      const translatedText = await this.translateText(transcriptionResult.text, this.config.targetLanguage);
      
      // Step 3: Medical Analysis using Ollama
      console.log('Step 3: Performing medical analysis...');
      const medicalAnalysis = await this.performMedicalAnalysis(translatedText);
      
      // Step 4: Content Segregation using Ollama
      console.log('Step 4: Segregating content...');
      const contentSegregation = await this.segregateContent(translatedText, medicalAnalysis);
      
      // Step 5: Generate Summary
      console.log('Step 5: Generating summary...');
      const summary = await this.generateSummary(translatedText, medicalAnalysis, contentSegregation);

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
      console.error('Error in medical analysis pipeline:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Pipeline processing failed: ${errorMessage}`);
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
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      text: result.text,
      language: result.language
    };
  }

  private async translateText(text: string, targetLanguage: string): Promise<string> {
    if (targetLanguage === 'auto' || targetLanguage === 'en') {
      return text; // No translation needed
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
      throw new Error(`Translation failed: ${response.status}`);
    }

    const result = await response.json();
    return result.translated_text;
  }

  private async performMedicalAnalysis(transcript: string): Promise<{
    symptoms: string[];
    chiefComplaints: string;
    recommendedMedicines: string[];
    diagnosis: string;
    notes: string;
    confidence: number;
  }> {
    const prompt = `You are a medical AI assistant analyzing a patient consultation transcript. Please provide a structured medical analysis in JSON format.

Consultation Transcript:
"${transcript}"

Please analyze the transcript and return a JSON response with the following structure:
{
  "symptoms": ["symptom1", "symptom2", ...],
  "chiefComplaints": "Main complaints summary",
  "recommendedMedicines": ["medicine1 - dosage/instructions", "medicine2 - dosage/instructions", ...],
  "diagnosis": "Primary diagnosis and assessment",
  "notes": "Additional clinical notes and recommendations",
  "confidence": 0.85
}

Focus on extracting specific symptoms mentioned, providing clear chief complaints summary, suggesting appropriate medications with dosages, giving a preliminary diagnosis, and adding relevant clinical notes. Only return the JSON response.`;

    const response = await fetch(`${this.config.ollamaEndpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Medical analysis failed: ${response.status}`);
    }

    const data = await response.json();
    return this.parseMedicalAnalysisResponse(data.response);
  }

  private async segregateContent(transcript: string, medicalAnalysis: any): Promise<{
    vitalSigns: string[];
    medications: string[];
    procedures: string[];
    allergies: string[];
    familyHistory: string[];
    socialHistory: string[];
  }> {
    const prompt = `You are a medical AI assistant specializing in content segregation. Please analyze the consultation transcript and medical analysis to extract and categorize specific medical information.

Consultation Transcript:
"${transcript}"

Medical Analysis:
- Symptoms: ${medicalAnalysis.symptoms.join(', ')}
- Diagnosis: ${medicalAnalysis.diagnosis}
- Medications: ${medicalAnalysis.recommendedMedicines.join(', ')}

Please return a JSON response with the following structure:
{
  "vitalSigns": ["blood pressure", "heart rate", "temperature", ...],
  "medications": ["current medications mentioned", "prescribed medications", ...],
  "procedures": ["medical procedures mentioned", "tests ordered", ...],
  "allergies": ["allergies mentioned", "adverse reactions", ...],
  "familyHistory": ["family medical history", "hereditary conditions", ...],
  "socialHistory": ["lifestyle factors", "occupation", "habits", ...]
}

Extract specific information from the transcript and categorize it appropriately. Only return the JSON response.`;

    const response = await fetch(`${this.config.ollamaEndpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Content segregation failed: ${response.status}`);
    }

    const data = await response.json();
    return this.parseContentSegregationResponse(data.response);
  }

  private async generateSummary(transcript: string, medicalAnalysis: any, contentSegregation: any): Promise<string> {
    const prompt = `Generate a comprehensive medical consultation summary based on the following information:

Transcript: "${transcript}"

Medical Analysis:
- Symptoms: ${medicalAnalysis.symptoms.join(', ')}
- Chief Complaints: ${medicalAnalysis.chiefComplaints}
- Diagnosis: ${medicalAnalysis.diagnosis}
- Recommended Medicines: ${medicalAnalysis.recommendedMedicines.join(', ')}
- Notes: ${medicalAnalysis.notes}

Content Segregation:
- Vital Signs: ${contentSegregation.vitalSigns.join(', ')}
- Medications: ${contentSegregation.medications.join(', ')}
- Procedures: ${contentSegregation.procedures.join(', ')}
- Allergies: ${contentSegregation.allergies.join(', ')}
- Family History: ${contentSegregation.familyHistory.join(', ')}
- Social History: ${contentSegregation.socialHistory.join(', ')}

Please create a professional medical consultation summary that a healthcare provider could use for patient records. Include all relevant information in a structured format.`;

    const response = await fetch(`${this.config.ollamaEndpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          max_tokens: 1000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Summary generation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'Summary generation failed.';
  }

  private parseMedicalAnalysisResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse medical analysis response:', error);
    }
    throw new Error('Failed to parse medical analysis response. Please check Ollama model and try again.');
  }

  private parseContentSegregationResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse content segregation response:', error);
    }
    throw new Error('Failed to parse content segregation response. Please check Ollama model and try again.');
  }

  /**
   * Get pipeline status
   */
  getStatus(): {initialized: boolean, services: {whisper: boolean, translation: boolean, ollama: boolean}} {
    return {
      initialized: this.isInitialized,
      services: {
        whisper: this.isInitialized,
        translation: this.isInitialized,
        ollama: this.isInitialized
      }
    };
  }

  /**
   * Manually reinitialize the pipeline (useful for debugging)
   */
  async reinitialize(): Promise<void> {
    console.log('Reinitializing Medical Analysis Pipeline...');
    this.isInitialized = false;
    await this.initialize();
  }
}

// Export a singleton instance
export const medicalAnalysisPipeline = new MedicalAnalysisPipeline();
