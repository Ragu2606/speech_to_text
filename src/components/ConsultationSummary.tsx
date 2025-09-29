import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  Mic, 
  FileText,
  Heart,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { initializeSimpleChatGPTPipeline } from '../utils/simpleChatGPTPipeline';

interface ConsultationData {
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
  duration: number;
}

const ConsultationSummary: React.FC = () => {
  const { 
    selectedPatient, 
    transcript, 
    setCurrentScreen, 
    setConsultationData
  } = useStore();

  const [consultationData, setLocalConsultationData] = useState<ConsultationData>({
    originalTranscript: '',
    translatedTranscript: '',
    symptoms: [],
    chiefComplaints: '',
    recommendedMedicines: [],
    diagnosis: '',
    notes: '',
    confidence: 0,
    summary: '',
    contentSegregation: {
      vitalSigns: [],
      medications: [],
      procedures: [],
      allergies: [],
      familyHistory: [],
      socialHistory: []
    },
    duration: 0
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // ChatGPT API Key - Replace with your actual API key
  const CHATGPT_API_KEY = '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'; // TODO: Replace with your actual API key

  // Real Ollama analysis - no mock data
  useEffect(() => {
    const generateSummary = async () => {
      if (!transcript || transcript.trim().length === 0) {
        console.log('No transcript available for analysis');
        setIsGenerating(false);
        return;
      }

      console.log('Generating real medical analysis for patient:', selectedPatient?.id);
      setIsGenerating(true);
      
      try {
        // Initialize ChatGPT pipeline with API key
        console.log('Initializing ChatGPT service with API key...');
        const pipeline = initializeSimpleChatGPTPipeline(CHATGPT_API_KEY);
        
        // Check if pipeline is initialized
        let pipelineStatus = pipeline.getStatus();
        if (!pipelineStatus.initialized) {
          console.log('Pipeline not initialized, attempting to reinitialize...');
          await pipeline.reinitialize();
          pipelineStatus = pipeline.getStatus();
          if (!pipelineStatus.initialized) {
            throw new Error('ChatGPT medical analysis pipeline failed to initialize. Please check your API key.');
          }
        }

        console.log('✅ ChatGPT pipeline is ready, processing transcript...');
        // Use ChatGPT to analyze the transcript
        console.log('Using ChatGPT for medical analysis...');
        const analysisResult = await pipeline.processText(transcript);
        
        // Convert the analysis result to our consultation data format
        const consultationData: ConsultationData = {
          originalTranscript: analysisResult.originalTranscript,
          translatedTranscript: analysisResult.originalTranscript, // Same as original since Whisper already translates
          symptoms: analysisResult.symptoms,
          chiefComplaints: analysisResult.chiefComplaints,
          recommendedMedicines: analysisResult.recommendedMedicines,
          diagnosis: analysisResult.diagnosis,
          notes: analysisResult.notes,
          confidence: analysisResult.confidence,
          summary: analysisResult.summary || `Patient consultation analysis completed with ${analysisResult.confidence}% confidence.`,
          contentSegregation: analysisResult.contentSegregation || {
            vitalSigns: [],
            medications: analysisResult.recommendedMedicines,
            procedures: [],
            allergies: selectedPatient?.allergies || [],
            familyHistory: selectedPatient?.familyHistory || [],
            socialHistory: []
          },
          duration: Math.floor(transcript.length / 10) // Rough estimate based on transcript length
        };
        
        console.log('Real medical analysis completed:', consultationData);
        setLocalConsultationData(consultationData);
        
      } catch (error) {
        console.error('Error generating medical analysis:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Set error state instead of mock data
        const errorData: ConsultationData = {
          originalTranscript: transcript,
          translatedTranscript: transcript,
          symptoms: ['Analysis failed - please check services'],
          chiefComplaints: 'Unable to analyze consultation - services unavailable',
          recommendedMedicines: ['Please restart services and try again'],
          diagnosis: 'Analysis unavailable - check ChatGPT and other services',
          notes: `Error: ${errorMessage}. Please ensure ChatGPT is configured and all services are available.`,
          confidence: 0,
          summary: 'Medical analysis failed due to service unavailability.',
          contentSegregation: {
            vitalSigns: ['Service unavailable'],
            medications: ['Service unavailable'],
            procedures: ['Service unavailable'],
            allergies: ['Service unavailable'],
            familyHistory: ['Service unavailable'],
            socialHistory: ['Service unavailable']
          },
          duration: 0
        };
        
        setLocalConsultationData(errorData);
      } finally {
        setIsGenerating(false);
      }
    };

    // Generate summary when component mounts, patient changes, or transcript changes
    generateSummary();
  }, [selectedPatient?.id, transcript]);

  const handleBack = () => {
    setCurrentScreen('consultation');
  };

  const handleEdit = (field: string, currentValue: string | string[]) => {
    setEditingField(field);
    setTempValue(Array.isArray(currentValue) ? currentValue.join(', ') : currentValue);
  };

  const handleSave = () => {
    if (editingField) {
      const newData = { ...consultationData };
      
      if (editingField === 'symptoms' || editingField === 'recommendedMedicines') {
        (newData as any)[editingField] = tempValue
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
      } else {
        (newData as any)[editingField] = tempValue;
      }
      
      setLocalConsultationData(newData);
      setEditingField(null);
      setTempValue('');
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleAddItem = (field: 'symptoms' | 'recommendedMedicines') => {
    const newData = { ...consultationData };
    newData[field] = [...newData[field], 'New item'];
    setLocalConsultationData(newData);
  };

  const handleRemoveItem = (field: 'symptoms' | 'recommendedMedicines', index: number) => {
    const newData = { ...consultationData };
    newData[field] = newData[field].filter((_, i) => i !== index);
    setLocalConsultationData(newData);
  };

  const handleSaveToStore = async () => {
    setIsSaving(true);
    try {
      setConsultationData(consultationData);
      console.log('Consultation data saved to store');
    } catch (error) {
      console.error('Error saving consultation data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Consultation Summary</h1>
                <p className="text-gray-600">
                  {selectedPatient?.name} • {formatDuration(consultationData.duration)} • 
                  <span className={`ml-2 ${getConfidenceColor(consultationData.confidence)}`}>
                    {getConfidenceText(consultationData.confidence)}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveToStore}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Summary'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-600">Analyzing consultation with ChatGPT...</span>
            </div>
          </div>
        )}

        {/* Transcript Display */}
        {!isGenerating && (consultationData.originalTranscript || consultationData.translatedTranscript) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Consultation Transcript
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {consultationData.originalTranscript && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Original (Gujarati)</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-gray-700 leading-relaxed">{consultationData.originalTranscript}</p>
                  </div>
                </div>
              )}
              {consultationData.translatedTranscript && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Translated (English)</h3>
                  <div className="bg-blue-50 rounded-lg p-4 border">
                    <p className="text-gray-700 leading-relaxed">{consultationData.translatedTranscript}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isGenerating && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Main Analysis */}
            <div className="space-y-6">
              {/* Chief Complaints */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Chief Complaints
                  </h2>
                  <button
                    onClick={() => handleEdit('chiefComplaints', consultationData.chiefComplaints)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit3 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {editingField === 'chiefComplaints' ? (
                  <div className="space-y-3">
                    <textarea
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">{consultationData.chiefComplaints}</p>
                )}
              </div>

              {/* Symptoms */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                    Symptoms
                  </h2>
                  <button
                    onClick={() => handleAddItem('symptoms')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-2">
                  {consultationData.symptoms.map((symptom, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-gray-700">{symptom}</span>
                      <button
                        onClick={() => handleRemoveItem('symptoms', index)}
                        className="p-1 hover:bg-orange-100 rounded"
                      >
                        <X className="w-4 h-4 text-orange-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnosis */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Diagnosis
                  </h2>
                  <button
                    onClick={() => handleEdit('diagnosis', consultationData.diagnosis)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit3 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {editingField === 'diagnosis' ? (
                  <div className="space-y-3">
                    <textarea
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">{consultationData.diagnosis}</p>
                )}
              </div>

              {/* Recommended Medicines */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-red-600" />
                    Recommended Medicines
                  </h2>
                  <button
                    onClick={() => handleAddItem('recommendedMedicines')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-2">
                  {consultationData.recommendedMedicines.map((medicine, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-gray-700">{medicine}</span>
                      <button
                        onClick={() => handleRemoveItem('recommendedMedicines', index)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Content Segregation */}
            <div className="space-y-6">
              {/* Vital Signs */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
                  <Mic className="w-5 h-5 mr-2 text-blue-600" />
                  Vital Signs
                </h2>
                <div className="space-y-2">
                  {consultationData.contentSegregation.vitalSigns.map((vital, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">{vital}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medications */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
                  <Heart className="w-5 h-5 mr-2 text-red-600" />
                  Current Medications
                </h2>
                <div className="space-y-2">
                  {consultationData.contentSegregation.medications.map((medication, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg">
                      <span className="text-gray-700">{medication}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Procedures */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  Procedures & Tests
                </h2>
                <div className="space-y-2">
                  {consultationData.contentSegregation.procedures.map((procedure, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-700">{procedure}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                  Allergies
                </h2>
                <div className="space-y-2">
                  {consultationData.contentSegregation.allergies.map((allergy, index) => (
                    <div key={index} className="p-3 bg-orange-50 rounded-lg">
                      <span className="text-gray-700">{allergy}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Family History */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
                  <Heart className="w-5 h-5 mr-2 text-purple-600" />
                  Family History
                </h2>
                <div className="space-y-2">
                  {consultationData.contentSegregation.familyHistory.map((history, index) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-700">{history}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social History */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
                  <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                  Social History
                </h2>
                <div className="space-y-2">
                  {consultationData.contentSegregation.socialHistory.map((social, index) => (
                    <div key={index} className="p-3 bg-indigo-50 rounded-lg">
                      <span className="text-gray-700">{social}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Notes */}
        {!isGenerating && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Clinical Notes
              </h2>
              <button
                onClick={() => handleEdit('notes', consultationData.notes)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Edit3 className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {editingField === 'notes' ? (
              <div className="space-y-3">
                <textarea
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">{consultationData.notes}</p>
            )}
          </div>
        )}

        {/* Summary */}
        {!isGenerating && consultationData.summary && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              AI-Generated Summary
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{consultationData.summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationSummary;
