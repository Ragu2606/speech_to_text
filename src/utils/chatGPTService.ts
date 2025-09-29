// ChatGPT Service for Medical Analysis
// Replaces Ollama for faster and more accurate medical analysis

export interface ChatGPTConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
}

export interface MedicalAnalysis {
  symptoms: string[];
  chiefComplaints: string;
  recommendedMedicines: string[];
  diagnosis: string;
  notes: string;
  confidence: number;
}

export interface ContentSegregation {
  vitalSigns: string[];
  medications: string[];
  procedures: string[];
  allergies: string[];
  familyHistory: string[];
  socialHistory: string[];
}

export class ChatGPTService {
  private config: ChatGPTConfig;
  private isInitialized: boolean = false;

  constructor(config: ChatGPTConfig) {
    this.config = {
      model: 'gpt-4o-mini', // Fast and cost-effective model
      baseURL: 'https://api.openai.com/v1',
      ...config
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if (!this.config.apiKey) {
        throw new Error('ChatGPT API key is required');
      }
      
      // Skip test connection during initialization to avoid blocking
      // The API key will be tested when making actual requests
      this.isInitialized = true;
      console.log('✅ ChatGPT service initialized successfully (API key will be tested on first request)');
    } catch (error) {
      console.error('❌ Failed to initialize ChatGPT service:', error);
      this.isInitialized = false;
    }
  }

  private async testConnection(): Promise<void> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ChatGPT API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Analyze medical consultation transcript
   */
  async analyzeConsultation(transcript: string): Promise<MedicalAnalysis> {
    if (!this.isInitialized) {
      throw new Error('ChatGPT service not initialized. Please check API key.');
    }

    // Test API key on first actual request
    if (!this.config.apiKey || this.config.apiKey === 'sk-your-api-key-here') {
      throw new Error('ChatGPT API key is not configured. Please add your API key to the code.');
    }

    const prompt = `You are a medical AI assistant. Analyze the following patient consultation transcript and extract medical information in JSON format.

TRANSCRIPT: "${transcript}"

Please provide a JSON response with the following structure:
{
  "symptoms": ["symptom1", "symptom2", ...],
  "chiefComplaints": "Main complaint description",
  "recommendedMedicines": ["medicine1 with dosage", "medicine2 with dosage", ...],
  "diagnosis": "Primary diagnosis",
  "notes": "Clinical notes and observations",
  "confidence": 0.85
}

Guidelines:
- Extract all mentioned symptoms
- Identify the primary complaint
- Suggest appropriate medications with dosages
- Provide a likely diagnosis
- Add clinical notes
- Set confidence score (0.0 to 1.0)
- Be specific and medical accurate
- If information is unclear, note it in the notes section`;

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ChatGPT API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from ChatGPT');
      }

      return this.parseAnalysisResponse(content);
    } catch (error) {
      console.error('Error analyzing consultation with ChatGPT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to analyze consultation: ${errorMessage}`);
    }
  }

  /**
   * Segregate medical content into categories
   */
  async segregateContent(transcript: string, _analysis: MedicalAnalysis): Promise<ContentSegregation> {
    if (!this.isInitialized) {
      throw new Error('ChatGPT service not initialized. Please check API key.');
    }

    const prompt = `You are a medical AI assistant. Analyze the following consultation transcript and segregate the medical information into specific categories.

TRANSCRIPT: "${transcript}"

Please provide a JSON response with the following structure:
{
  "vitalSigns": ["blood pressure: 120/80", "heart rate: 72 bpm", ...],
  "medications": ["current medication1", "current medication2", ...],
  "procedures": ["procedure1", "procedure2", ...],
  "allergies": ["allergy1", "allergy2", ...],
  "familyHistory": ["family condition1", "family condition2", ...],
  "socialHistory": ["smoking status", "alcohol use", "occupation", ...]
}

Guidelines:
- Extract only information explicitly mentioned
- Use specific medical terminology
- If a category has no information, use empty array []
- Be precise and accurate`;

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ChatGPT API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from ChatGPT');
      }

      return this.parseSegregationResponse(content);
    } catch (error) {
      console.error('Error segregating content with ChatGPT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to segregate content: ${errorMessage}`);
    }
  }

  /**
   * Generate medical summary
   */
  async generateSummary(transcript: string, analysis: MedicalAnalysis, segregation: ContentSegregation): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('ChatGPT service not initialized. Please check API key.');
    }

    const prompt = `You are a medical AI assistant. Generate a comprehensive medical summary based on the consultation transcript and analysis.

TRANSCRIPT: "${transcript}"

ANALYSIS: ${JSON.stringify(analysis, null, 2)}

CONTENT SEGREGATION: ${JSON.stringify(segregation, null, 2)}

Please provide a detailed medical summary that includes:
1. Patient presentation and chief complaint
2. Key symptoms and findings
3. Assessment and diagnosis
4. Treatment plan and recommendations
5. Follow-up instructions

Make it professional, comprehensive, and suitable for medical records.`;

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.4
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ChatGPT API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Summary generation failed. Please try again.';
    } catch (error) {
      console.error('Error generating summary with ChatGPT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate summary: ${errorMessage}`);
    }
  }

  private parseAnalysisResponse(response: string): MedicalAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        return {
          symptoms: analysisData.symptoms || [],
          chiefComplaints: analysisData.chiefComplaints || '',
          recommendedMedicines: analysisData.recommendedMedicines || [],
          diagnosis: analysisData.diagnosis || '',
          notes: analysisData.notes || '',
          confidence: analysisData.confidence || 0.8
        };
      }
      
      // Fallback if JSON parsing fails
      throw new Error('Invalid JSON response from ChatGPT');
    } catch (error) {
      console.error('Error parsing ChatGPT analysis response:', error);
      throw new Error('Failed to parse medical analysis response');
    }
  }

  private parseSegregationResponse(response: string): ContentSegregation {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const segregationData = JSON.parse(jsonMatch[0]);
        return {
          vitalSigns: segregationData.vitalSigns || [],
          medications: segregationData.medications || [],
          procedures: segregationData.procedures || [],
          allergies: segregationData.allergies || [],
          familyHistory: segregationData.familyHistory || [],
          socialHistory: segregationData.socialHistory || []
        };
      }
      
      // Fallback if JSON parsing fails
      throw new Error('Invalid JSON response from ChatGPT');
    } catch (error) {
      console.error('Error parsing ChatGPT segregation response:', error);
      throw new Error('Failed to parse content segregation response');
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      model: this.config.model
    };
  }

  /**
   * Manually reinitialize the service
   */
  async reinitialize(): Promise<void> {
    console.log('Reinitializing ChatGPT service...');
    this.isInitialized = false;
    await this.initialize();
  }
}

// Export a singleton instance (will be initialized with API key)
export let chatGPTService: ChatGPTService | null = null;

export function initializeChatGPT(apiKey: string): ChatGPTService {
  chatGPTService = new ChatGPTService({ apiKey });
  return chatGPTService;
}
