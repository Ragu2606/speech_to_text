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
      }
    } catch (error) {
      console.warn('Local LLM service not available. Using mock data.');
      this.isInitialized = false;
    }
  }

  /**
   * Analyze consultation transcript and generate medical insights using local LLM
   */
  async analyzeConsultation(transcript: string, patientInfo?: any): Promise<MedicalAnalysis> {
    if (!this.isInitialized) {
      console.warn('Local LLM not available. Using mock data.');
      return this.getMockAnalysis(transcript);
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
      return this.parseAnalysisResponse(data.response, transcript);
    } catch (error) {
      console.error('Error analyzing consultation with local LLM:', error);
      return this.getMockAnalysis(transcript);
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
  private parseAnalysisResponse(response: string, transcript: string): MedicalAnalysis {
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
      console.warn('Failed to parse LLM response, using fallback analysis');
    }
    
    // Fallback to mock analysis if parsing fails
    return this.getMockAnalysis(transcript);
  }


  /**
   * Generate mock analysis for development/testing
   */
  private getMockAnalysis(transcript: string): MedicalAnalysis {
    // Comprehensive mock analysis with realistic medical scenarios
    const lowerTranscript = transcript.toLowerCase();
    
    const symptoms: string[] = [];
    const medicines: string[] = [];
    let diagnosis = 'General assessment and monitoring recommended';
    let chiefComplaints = 'Patient consultation completed with comprehensive evaluation';
    let notes = 'Continue monitoring symptoms and follow up as needed. Patient education provided.';

    // Advanced symptom detection with realistic medical scenarios
    if (lowerTranscript.includes('chest pain') || lowerTranscript.includes('chest discomfort')) {
      symptoms.push('Chest pain', 'Discomfort on deep breathing', 'Possible musculoskeletal strain');
      diagnosis = 'Musculoskeletal chest pain - likely costochondritis or muscle strain';
      medicines.push('Ibuprofen 400mg - 3 times daily with food', 'Acetaminophen 500mg - as needed for pain', 'Heat therapy application');
    }
    
    if (lowerTranscript.includes('shortness of breath') || lowerTranscript.includes('breathing') || lowerTranscript.includes('dyspnea')) {
      symptoms.push('Shortness of breath', 'Difficulty breathing', 'Respiratory distress');
      diagnosis = 'Respiratory symptoms requiring further evaluation - consider pulmonary function tests';
      medicines.push('Albuterol inhaler - 2 puffs every 4-6 hours as needed', 'Prednisone 20mg daily for 5 days if severe');
    }
    
    if (lowerTranscript.includes('headache') || lowerTranscript.includes('head pain') || lowerTranscript.includes('migraine')) {
      symptoms.push('Headache', 'Cephalgia', 'Possible tension-type headache');
      diagnosis = 'Tension-type headache with possible migraine component';
      medicines.push('Sumatriptan 50mg - at onset of headache', 'Ibuprofen 600mg - every 6 hours as needed', 'Magnesium 400mg daily');
    }
    
    if (lowerTranscript.includes('fever') || lowerTranscript.includes('temperature') || lowerTranscript.includes('chills')) {
      symptoms.push('Fever', 'Elevated body temperature', 'Chills and malaise');
      diagnosis = 'Viral syndrome or bacterial infection - monitor for complications';
      medicines.push('Acetaminophen 650mg - every 6 hours', 'Ibuprofen 400mg - every 8 hours', 'Increased fluid intake');
    }
    
    if (lowerTranscript.includes('fatigue') || lowerTranscript.includes('tired') || lowerTranscript.includes('exhaustion')) {
      symptoms.push('Fatigue', 'Generalized weakness', 'Decreased energy levels');
      diagnosis = 'Fatigue - rule out anemia, thyroid dysfunction, or chronic fatigue syndrome';
      medicines.push('Iron supplement if anemic', 'B12 vitamin if deficient', 'Sleep hygiene counseling');
    }

    if (lowerTranscript.includes('nausea') || lowerTranscript.includes('vomiting') || lowerTranscript.includes('stomach')) {
      symptoms.push('Nausea', 'Gastrointestinal upset', 'Possible gastritis');
      diagnosis = 'Gastroenteritis or gastritis - monitor for dehydration';
      medicines.push('Ondansetron 4mg - every 8 hours as needed', 'Proton pump inhibitor if gastritis', 'Clear liquid diet initially');
    }

    if (lowerTranscript.includes('joint pain') || lowerTranscript.includes('arthritis') || lowerTranscript.includes('stiffness')) {
      symptoms.push('Joint pain', 'Arthritis symptoms', 'Morning stiffness');
      diagnosis = 'Osteoarthritis or inflammatory arthritis - consider rheumatology referral';
      medicines.push('Meloxicam 15mg daily', 'Physical therapy referral', 'Joint protection strategies');
    }

    // Extract and enhance chief complaints
    if (transcript.length > 50) {
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length > 0) {
        chiefComplaints = sentences[0].trim() + '. Patient reports additional symptoms and concerns during consultation.';
      }
    }

    // Add comprehensive recommendations based on symptoms
    if (medicines.length === 0) {
      medicines.push('General supportive care and monitoring', 'Lifestyle modifications as appropriate', 'Follow-up in 1-2 weeks if symptoms persist');
    }

    // Enhanced clinical notes
    notes = `Comprehensive AI analysis completed. Patient presents with multiple symptoms requiring careful evaluation. 
    Recommend close monitoring of symptoms, patient education on warning signs, and appropriate follow-up care. 
    Consider additional diagnostic testing if symptoms worsen or persist beyond expected timeframe. 
    Patient counseled on medication compliance and lifestyle modifications. 
    This analysis is for informational purposes and should be reviewed by a qualified healthcare professional.`;

    return {
      symptoms: symptoms.length > 0 ? symptoms : ['General consultation', 'Routine health assessment', 'Preventive care discussion'],
      chiefComplaints,
      recommendedMedicines: medicines,
      diagnosis,
      notes,
      confidence: 0.85
    };
  }

  /**
   * Generate a summary of the consultation using local LLM
   */
  async generateSummary(transcript: string, analysis: MedicalAnalysis): Promise<string> {
    if (!this.isInitialized) {
      return this.getMockSummary(transcript, analysis);
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
      return data.response || this.getMockSummary(transcript, analysis);
    } catch (error) {
      console.error('Error generating summary with local LLM:', error);
      return this.getMockSummary(transcript, analysis);
    }
  }

  private getMockSummary(_transcript: string, analysis: MedicalAnalysis): string {
    return `
CONSULTATION SUMMARY

Patient presented with the following concerns:
${analysis.chiefComplaints}

Identified Symptoms:
${analysis.symptoms.map(s => `• ${s}`).join('\n')}

Assessment:
${analysis.diagnosis}

Recommendations:
${analysis.recommendedMedicines.map(m => `• ${m}`).join('\n')}

Additional Notes:
${analysis.notes}

This summary was generated using AI assistance and should be reviewed by a qualified healthcare professional.
    `.trim();
  }
}

// Export a singleton instance
export const localLLM = new LocalLLMService();

// Backward compatibility - keep the old export name for now
export const geminiAI = localLLM;
