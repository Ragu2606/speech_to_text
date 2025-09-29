import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Square, 
  ArrowLeft, 
  User,
  Clock,
  Volume2,
  Languages,
  FileText,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { realtimeTranscription, type TranscriptionResult } from '../utils/realtimeTranscription';
import { medicalAnalysisPipeline } from '../utils/medicalAnalysisPipeline';
import PreDiagnosisCards from './PreDiagnosisCards';

const RealtimeConsultation: React.FC = () => {
  const { 
    selectedPatient, 
    setCurrentScreen,
    transcript,
    setTranscript
  } = useStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [realtimeTranscripts, setRealtimeTranscripts] = useState<TranscriptionResult[]>([]);
  const [serviceStatus, setServiceStatus] = useState({
    realtime: false,
    ollama: false,
    overall: false
  });

  const recordingIntervalRef = useRef<number | null>(null);

  // Check service status on component mount
  useEffect(() => {
    checkServiceStatus();
  }, []);

  // Update recording time
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const checkServiceStatus = async () => {
    try {
      // Check real-time transcription service
      const realtimeResponse = await fetch('http://127.0.0.1:9002/health');
      const translationResponse = await fetch('http://127.0.0.1:9001/health');
      const transcriptionStatus = realtimeResponse.ok && translationResponse.ok;
      
      // Check Ollama service
      let ollamaStatus = false;
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        ollamaStatus = response.ok;
      } catch (error) {
        console.error('Ollama service check failed:', error);
      }

      setServiceStatus({
        realtime: transcriptionStatus,
        ollama: ollamaStatus,
        overall: transcriptionStatus && ollamaStatus
      });
    } catch (error) {
      console.error('Service status check failed:', error);
      setServiceStatus({
        realtime: false,
        ollama: false,
        overall: false
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    if (isRecording) {
      if (window.confirm('Recording is in progress. Are you sure you want to go back?')) {
        stopRecording();
        setCurrentScreen('patient-details');
      }
    } else {
      setCurrentScreen('patient-details');
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Starting real-time transcription...');
      
      // Set up transcription callback
      realtimeTranscription.setTranscriptionCallback((result: TranscriptionResult) => {
        console.log('📝 Real-time transcription:', result.text);
        setRealtimeTranscripts(prev => [...prev, result]);
        
        // Update the main transcript with the latest text
        setTranscript(result.text);
      });

      // Start real-time transcription
      await realtimeTranscription.startTranscription();
      
      setIsRecording(true);
      setRecordingTime(0);
      setRealtimeTranscripts([]);
      setTranscript('');
      
      console.log('🎤 Real-time transcription started');
    } catch (error) {
      console.error('Error starting real-time transcription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error starting transcription: ${errorMessage}`);
    }
  };

  const stopRecording = async () => {
    try {
      console.log('🛑 Stopping real-time transcription...');
      
      // Stop real-time transcription
      await realtimeTranscription.stopTranscription();
      
      setIsRecording(false);
      
      // Get all transcriptions and combine them
      const allTranscripts = await realtimeTranscription.getTranscriptions();
      const combinedText = allTranscripts.map(t => t.text).join(' ');
      
      if (combinedText.trim()) {
        setTranscript(combinedText);
        console.log('📝 Final combined transcript:', combinedText);
      }
      
      console.log('🛑 Real-time transcription stopped');
    } catch (error) {
      console.error('Error stopping real-time transcription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error stopping transcription: ${errorMessage}`);
    }
  };

  const generateSummary = async () => {
    if (!transcript.trim()) {
      alert('No transcript available. Please record some audio first.');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('🤖 Starting medical analysis pipeline: Whisper → Ollama');
      console.log('📝 Processing transcript:', transcript);
      
      // Use the medical analysis pipeline to process the transcript
      const analysisResult = await medicalAnalysisPipeline.processText(transcript);
      
      console.log('✅ Medical analysis completed, navigating to summary');
      
      // Store the analysis result in the global state
      useStore.getState().setConsultationData({
        originalTranscript: analysisResult.originalTranscript,
        translatedTranscript: analysisResult.translatedTranscript,
        symptoms: analysisResult.symptoms,
        chiefComplaints: analysisResult.chiefComplaints,
        recommendedMedicines: analysisResult.recommendedMedicines,
        diagnosis: analysisResult.diagnosis,
        notes: analysisResult.notes,
        confidence: analysisResult.confidence,
        summary: analysisResult.summary,
        contentSegregation: analysisResult.contentSegregation,
        duration: Math.floor(transcript.length / 10)
      });
      
      // Navigate to summary screen
      setCurrentScreen('summary');
    } catch (error) {
      console.error('Error generating summary:', error);
      alert(`Medical analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease ensure Whisper and Ollama services are running.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const WaveformBar: React.FC<{ delay: number; height: number }> = ({ delay, height }) => (
    <motion.div
      className="bg-gradient-to-t from-primary-400 to-primary-500 rounded-full"
      style={{ width: '4px', height: `${height}px` }}
      animate={{
        scaleY: [1, 1.5, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
    />
  );

  return (
    <div className="min-h-screen p-6 pt-20 sm:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="glass rounded-xl p-3 mr-4 hover:bg-white/20 transition-all duration-300"
            >
              <ArrowLeft className="w-6 h-6 text-primary-600" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-primary-900">Real-time Consultation</h1>
              <p className="text-primary-600">Live transcription with {selectedPatient?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="glass rounded-xl p-3">
              <Clock className="w-5 h-5 text-primary-600 mr-2 inline" />
              <span className="text-primary-900 font-mono text-lg">
                {formatTime(recordingTime)}
              </span>
            </div>
            <div className="glass rounded-xl p-3">
              <Volume2 className={`w-5 h-5 mr-2 inline ${isRecording ? 'text-accent-500' : 'text-primary-400'}`} />
              <span className={`text-sm ${isRecording ? 'text-accent-600' : 'text-primary-500'}`}>
                {isRecording ? 'Live Transcription' : 'Stopped'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Service Status Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="glass rounded-xl p-3 flex items-center">
              <Languages className={`w-4 h-4 mr-2 ${serviceStatus.overall ? 'text-green-500' : 'text-yellow-500'}`} />
              <span className={`text-sm ${serviceStatus.overall ? 'text-green-600' : 'text-yellow-600'}`}>
                {serviceStatus.overall ? 'Real-time → Whisper → Ollama' : 'Services Unavailable'}
              </span>
            </div>
            <div className="glass rounded-xl p-3 flex items-center">
              {serviceStatus.realtime ? (
                <Wifi className="w-4 h-4 mr-2 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 mr-2 text-red-500" />
              )}
              <span className={`text-sm ${serviceStatus.realtime ? 'text-green-600' : 'text-red-600'}`}>
                Real-time: {serviceStatus.realtime ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="glass rounded-xl p-3 flex items-center">
              {serviceStatus.ollama ? (
                <Wifi className="w-4 h-4 mr-2 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 mr-2 text-red-500" />
              )}
              <span className={`text-sm ${serviceStatus.ollama ? 'text-green-600' : 'text-red-600'}`}>
                Ollama: {serviceStatus.ollama ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Patient Info Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-1"
          >
            {/* Patient Card */}
            <div className="glass rounded-2xl p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-900">{selectedPatient?.name}</h3>
                  <p className="text-primary-600 text-sm">ID: {selectedPatient?.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-primary-600">
                  <span>Age:</span>
                  <span>{selectedPatient?.age} years</span>
                </div>
                <div className="flex justify-between text-primary-600">
                  <span>Gender:</span>
                  <span>{selectedPatient?.gender}</span>
                </div>
                <div className="flex justify-between text-primary-600">
                  <span>Status:</span>
                  <span>{isRecording ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex justify-between text-primary-600">
                  <span>Words:</span>
                  <span>{transcript.split(' ').length}</span>
                </div>
              </div>
            </div>

            {/* Real-time Transcripts */}
            {realtimeTranscripts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-xl font-semibold text-primary-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Live Transcription
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {realtimeTranscripts.map((transcript, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-primary-50 rounded-lg p-3 border border-primary-200"
                    >
                      <p className="text-primary-900 text-sm leading-relaxed">{transcript.text}</p>
                      <p className="text-primary-500 text-xs mt-1">
                        {new Date(transcript.timestamp * 1000).toLocaleTimeString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Pre-Diagnosis Tests */}
            <PreDiagnosisCards tests={selectedPatient?.preDiagnosisTests} />
          </motion.div>

          {/* Main Recording Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-2"
          >
            {/* Audio Waveform */}
            <div className="glass rounded-2xl p-8 mb-6">
              <div className="flex justify-center items-center space-x-1 mb-8">
                {Array.from({ length: 20 }).map((_, i) => (
                  <WaveformBar
                    key={i}
                    delay={i * 0.1}
                    height={isRecording ? Math.random() * 40 + 20 : 20}
                  />
                ))}
              </div>

              {/* Recording Controls */}
              <div className="flex justify-center space-x-4">
                {!isRecording ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startRecording}
                    disabled={!serviceStatus.realtime}
                    className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 sm:py-4 px-4 sm:px-8 rounded-xl transition-all duration-300 flex items-center"
                  >
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Start Live Transcription
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopRecording}
                    className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-8 rounded-xl transition-all duration-300 flex items-center"
                  >
                    <Square className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Stop Transcription
                  </motion.button>
                )}
              </div>
            </div>

            {/* Recording Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-xl font-semibold text-primary-900 mb-4 flex items-center">
                <Volume2 className="w-5 h-5 mr-2" />
                Recording Status
                <span className="ml-2 text-sm font-normal">
                  ({isRecording ? 'Live' : 'Stopped'})
                </span>
              </h3>
              
              <AnimatePresence mode="wait">
                {!isRecording ? (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-4 h-4 bg-gray-400 rounded-full mr-3" />
                      <span className="font-medium text-gray-600">Ready to start</span>
                    </div>
                    <p className="text-primary-700">
                      Click "Start Live Transcription" to begin real-time speech-to-text conversion.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Real-time transcription will convert speech to English text as you speak.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="recording"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-3 h-3 bg-red-500 rounded-full mr-3"
                      />
                      <span className="font-medium text-red-600">Live transcription active</span>
                    </div>
                    <p className="text-primary-700">
                      Speaking in real-time... Your speech is being converted to English text.
                    </p>
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Live:</strong> Transcription appears in real-time on the left panel.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Final Transcript Display */}
            {transcript && !isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="glass rounded-2xl p-6 mt-6"
              >
                <h3 className="text-xl font-semibold text-primary-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Final Transcription
                </h3>
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 mb-4">
                  <p className="text-primary-900 leading-relaxed">{transcript}</p>
                </div>
                
                {/* Generate Summary Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateSummary}
                  disabled={!serviceStatus.ollama || isProcessing}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {isProcessing ? 'Generating...' : 'Generate Medical Summary with Ollama'}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Processing Overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-8 text-center max-w-md mx-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-primary-900 mb-2">
                  Generating Summary
                </h3>
                <p className="text-primary-600">
                  Processing: Whisper → Ollama → Generating medical summary...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default RealtimeConsultation;
