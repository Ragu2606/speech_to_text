// Local LLM integration utility
// This service connects to a local LLM API running on localhost

export interface MedicalAnalysis {
  symptoms: string[];
  chiefComplaints: string;
  recommendedMedicines: string[];
  diagnosis: string;
  notes: string;
  confidence: number;
}

export class LocalLLMService {
  private baseUrl: string;
  private isInitialized: boolean = false;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.isInitialized = response.ok;
      if (this.isInitialized) {
        console.log('Local LLM service connected successfully');
      } else {
        console.error('Local LLM service not available. Ollama must be running.');
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Local LLM service not available. Please start Ollama service.');
      this.isInitialized = false;
    }
  }

  /**
   * Analyze consultation transcript and generate medical insights using local LLM
   */
  async analyzeConsultation(transcript: string, patientInfo?: any): Promise<MedicalAnalysis> {
    if (!this.isInitialized) {
      throw new Error('Local LLM service not available. Please start Ollama service.');
    }

    try {
      const prompt = this.buildAnalysisPrompt(transcript, patientInfo);
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2:latest', // Use llama3.2 or any available model
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Local LLM API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAnalysisResponse(data.response);
    } catch (error) {
      console.error('Error analyzing consultation with local LLM:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to analyze consultation: ${errorMessage}`);
    }
  }

  /**
   * Build analysis prompt for the local LLM
   */
  private buildAnalysisPrompt(transcript: string, patientInfo?: any): string {
    return `You are a medical AI assistant analyzing a patient consultation transcript. Please provide a structured medical analysis in JSON format.

Patient Information: ${patientInfo ? JSON.stringify(patientInfo) : 'Not provided'}

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
  }

  /**
   * Parse the LLM response and extract medical analysis
   */
  private parseAnalysisResponse(response: string): MedicalAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        return {
          symptoms: Array.isArray(analysisData.symptoms) ? analysisData.symptoms : [],
          chiefComplaints: analysisData.chiefComplaints || 'Analysis completed',
          recommendedMedicines: Array.isArray(analysisData.recommendedMedicines) ? analysisData.recommendedMedicines : [],
          diagnosis: analysisData.diagnosis || 'Further evaluation required',
          notes: analysisData.notes || 'Consultation completed successfully',
          confidence: analysisData.confidence || 0.8
        };
      }
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
    }
    
    // If parsing fails, throw an error instead of using mock data
    throw new Error('Failed to parse LLM response. Please check Ollama model and try again.');
  }



  /**
   * Generate a summary of the consultation using local LLM
   */
  async generateSummary(transcript: string, analysis: MedicalAnalysis): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Local LLM service not available. Please start Ollama service.');
    }

    try {
      const prompt = `Generate a comprehensive consultation summary based on the following:

Transcript: "${transcript}"

Analysis:
- Symptoms: ${analysis.symptoms.join(', ')}
- Chief Complaints: ${analysis.chiefComplaints}
- Diagnosis: ${analysis.diagnosis}
- Recommended Medicines: ${analysis.recommendedMedicines.join(', ')}
- Notes: ${analysis.notes}

Please create a professional medical consultation summary that a healthcare provider could use for patient records.`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2:latest',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            max_tokens: 1000,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Local LLM API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || 'Summary generation failed. Please try again.';
    } catch (error) {
      console.error('Error generating summary with local LLM:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate summary: ${errorMessage}`);
    }
  }

}

// Export a singleton instance
export const localLLM = new LocalLLMService();

// Backward compatibility - keep the old export name for now
export const geminiAI = localLLM;
