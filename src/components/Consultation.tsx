import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Square, 
  ArrowLeft, 
  User,
  Clock,
  Volume2,
  Languages,
  Globe,
  FileText,
  Sparkles,
  Brain,
  Loader2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { simpleTranscription } from '../utils/simpleTranscription';
import { initializeSimpleChatGPTPipeline } from '../utils/simpleChatGPTPipeline';
import PreDiagnosisCards from './PreDiagnosisCards';

const Consultation: React.FC = () => {
  const { 
    selectedPatient, 
    isRecording, 
    transcript, 
    setIsRecording, 
    setCurrentScreen,
    mediaRecorder,
    setMediaRecorder,
    setAudioChunks,
    setIsLiveTranscriptionActive,
    clearLiveTranscriptionResults
  } = useStore();

  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({ whisper: false, overall: false });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunkIntervalRef = useRef<number | null>(null);
  
  // ChatGPT API Key - Replace with your actual API key
  const CHATGPT_API_KEY = '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'; // TODO: Replace with your actual API key


  // Check service status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Force reinitialize the service
        await simpleTranscription.reinitialize();
        const status = simpleTranscription.getStatus();
        setServiceStatus({
          whisper: status.initialized,
          overall: status.initialized
        });
        console.log('📊 Service status:', status);
      } catch (error) {
        console.error('Service status check failed:', error);
        setServiceStatus({
          whisper: false,
          overall: false
        });
      }
    };
    checkStatus();
  }, []);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Use WebM with Opus codec for better browser support
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/mp4';
        }
      }
      
      console.log('🎤 Using MediaRecorder mimeType:', mimeType);
      console.log('🎤 MediaRecorder supported types:', [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ].filter(type => MediaRecorder.isTypeSupported(type)));
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      const chunks: Blob[] = [];
      
      console.log('🎤 Starting recording (no live transcription)...');
      
      // Disable live transcription
      setIsLiveTranscriptionActive(false);
      clearLiveTranscriptionResults();
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log('🎤 Received audio chunk:', event.data.size, 'bytes, type:', event.data.type);
          console.log('📊 Total chunks accumulated:', chunks.length);
          
          // Update audio chunks in store for later processing
          setAudioChunks([...chunks]);
        }
      };
      
      recorder.onstop = () => {
        console.log('🎤 Recording stopped, audio chunks ready for processing');
        // Audio chunks are already stored in the store, will be processed in stopRecording
      };
      
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      
      // Start recording with time slices to collect audio chunks
      recorder.start(1000); // Collect data every 1 second
      setIsRecording(true);
      setRecordingTime(0);
      
      console.log('🎤 Recording started - audio will be processed when Stop & Complete is clicked');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      setIsLiveTranscriptionActive(false);
      setIsProcessing(true);
      
      // Clear any pending live transcription intervals
      if (audioChunkIntervalRef.current) {
        clearInterval(audioChunkIntervalRef.current);
        audioChunkIntervalRef.current = null;
      }
      
      try {
        // Wait for the last audio chunk to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get all audio chunks from the store
        const { audioChunks } = useStore.getState();
        
        if (audioChunks.length === 0) {
          throw new Error('No audio recorded');
        }
        
        // Combine all audio chunks into a single blob
        const completeAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Complete audio blob created:', completeAudioBlob.size, 'bytes');
        
        // Send to Whisper for transcription
        console.log('Sending audio to Whisper for transcription...');
        const transcriptionResult = await simpleTranscription.transcribeToEnglish(completeAudioBlob);
        
        console.log('Transcription completed:', transcriptionResult);
        
        // Set the transcript in the store
        useStore.getState().setTranscript(transcriptionResult.text);
        
        // Clear audio chunks
        useStore.getState().setAudioChunks([]);
        
        console.log('Transcription completed, starting AI analysis...');
        setIsProcessing(false);
        
        // Trigger AI analysis after transcription
        await triggerAIAnalysis(transcriptionResult.text);
        
      } catch (error) {
        console.error('Error processing audio:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Error processing audio: ${errorMessage}\n\nPlease check:\n1. Whisper service is running\n2. Audio was recorded properly\n3. Network connection is stable`);
        setIsProcessing(false);
      }
    }
  };

  const triggerAIAnalysis = async (transcript: string) => {
    if (!transcript || transcript.trim().length === 0) {
      console.log('No transcript available for AI analysis');
      return;
    }

    try {
      setIsAnalyzing(true);
      console.log('🤖 Starting ChatGPT analysis for transcript:', transcript);
      
      // Initialize ChatGPT pipeline with API key
      const pipeline = initializeSimpleChatGPTPipeline(CHATGPT_API_KEY);
      
      // Check if pipeline is initialized
      let pipelineStatus = pipeline.getStatus();
      if (!pipelineStatus.initialized) {
        console.log('Pipeline not initialized, attempting to reinitialize...');
        await pipeline.reinitialize();
        pipelineStatus = pipeline.getStatus();
        if (!pipelineStatus.initialized) {
          throw new Error('ChatGPT service failed to initialize. Please check your API key.');
        }
      }

      console.log('✅ ChatGPT pipeline is ready, processing transcript...');
      // Call ChatGPT for analysis
      const analysis = await pipeline.processText(transcript);
      
      console.log('✅ ChatGPT analysis completed:', analysis);
      setAiAnalysis(analysis);
      
      // Store the analysis in the global state
      useStore.getState().setConsultationData({
        originalTranscript: analysis.originalTranscript,
        translatedTranscript: analysis.originalTranscript,
        symptoms: analysis.symptoms,
        chiefComplaints: analysis.chiefComplaints,
        recommendedMedicines: analysis.recommendedMedicines,
        diagnosis: analysis.diagnosis,
        notes: analysis.notes,
        confidence: analysis.confidence,
        summary: analysis.summary || `Patient consultation analysis completed with ${analysis.confidence}% confidence.`,
        contentSegregation: analysis.contentSegregation || {
          vitalSigns: [],
          medications: analysis.recommendedMedicines,
          procedures: [],
          allergies: selectedPatient?.allergies || [],
          familyHistory: selectedPatient?.familyHistory || [],
          socialHistory: []
        },
        duration: recordingTime
      });
      
    } catch (error) {
      console.error('❌ ChatGPT analysis failed:', error);
      // Show error but don't block the user
      alert(`ChatGPT analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nYou can still view the transcription and proceed manually.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    if (isRecording) {
      stopRecording();
    }
    setCurrentScreen('patient-details');
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
              <h1 className="text-3xl font-bold text-primary-900">Live Consultation</h1>
              <p className="text-primary-600">Recording session with {selectedPatient?.name}</p>
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
                {isRecording ? 'Recording' : 'Stopped'}
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
                {serviceStatus.overall ? 'Speech → English' : 'Service Offline'}
              </span>
            </div>
            <div className="glass rounded-xl p-3 flex items-center">
              <Globe className={`w-4 h-4 mr-2 ${serviceStatus.whisper ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm ${serviceStatus.whisper ? 'text-green-600' : 'text-red-600'}`}>
                Whisper: {serviceStatus.whisper ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Patient Info Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="glass rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-full flex items-center justify-center mr-3">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-primary-900 truncate">{selectedPatient?.name}</h3>
                  <p className="text-primary-600 text-xs sm:text-sm">
                    {selectedPatient?.age} years • {selectedPatient?.gender}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-primary-600">
                  <span>Session Time:</span>
                  <span className="font-mono">{formatTime(recordingTime)}</span>
                </div>
                <div className="flex justify-between text-primary-600">
                  <span>Status:</span>
                  <span className={isRecording ? 'text-accent-600' : 'text-primary-400'}>
                    {isRecording ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between text-primary-600">
                  <span>Words:</span>
                  <span>{transcript.split(' ').length}</span>
                </div>
              </div>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-xl font-semibold text-primary-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Transcription Result
                </h3>
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 mb-4">
                  <p className="text-primary-900 leading-relaxed">{transcript}</p>
                </div>
                
                {/* AI Analysis Status */}
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4"
                  >
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                      <span className="text-blue-800 font-medium">ChatGPT is analyzing the consultation...</span>
                    </div>
                  </motion.div>
                )}

                {/* AI Analysis Results */}
                {aiAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4"
                  >
                    <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      ChatGPT Analysis Results
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-green-700">Diagnosis:</span>
                        <p className="text-green-800 mt-1">{aiAnalysis.diagnosis}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-green-700">Chief Complaints:</span>
                        <p className="text-green-800 mt-1">{aiAnalysis.chiefComplaints}</p>
                      </div>
                      
                      {aiAnalysis.symptoms.length > 0 && (
                        <div>
                          <span className="font-medium text-green-700">Symptoms:</span>
                          <ul className="text-green-800 mt-1 list-disc list-inside">
                            {aiAnalysis.symptoms.map((symptom: string, index: number) => (
                              <li key={index}>{symptom}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {aiAnalysis.recommendedMedicines.length > 0 && (
                        <div>
                          <span className="font-medium text-green-700">Recommended Medicines:</span>
                          <ul className="text-green-800 mt-1 list-disc list-inside">
                            {aiAnalysis.recommendedMedicines.map((medicine: string, index: number) => (
                              <li key={index}>{medicine}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-green-700">Confidence:</span>
                        <span className="text-green-800 ml-2">{aiAnalysis.confidence}%</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Generate Summary Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentScreen('summary')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Medical Summary with ChatGPT
                </motion.button>
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
            <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
              <div className="text-center mb-8">
                <motion.div
                  animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center"
                  style={{
                    background: isRecording 
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                      : 'linear-gradient(135deg, #64748b, #475569)'
                  }}
                >
                  {isRecording ? (
                    <MicOff className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                  )}
                </motion.div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-2">
                  {isRecording ? 'Recording in Progress' : 'Ready to Record'}
                </h2>
                <p className="text-primary-600">
                  {isRecording 
                    ? 'Click stop when consultation is complete' 
                    : 'Click start to begin recording the consultation'
                  }
                </p>
              </div>

              {/* Waveform Visualization */}
              <div className="flex items-center justify-center space-x-1 mb-8">
                {Array.from({ length: 20 }).map((_, i) => (
                  <WaveformBar
                    key={i}
                    delay={i * 0.1}
                    height={isRecording ? Math.random() * 40 + 20 : 10}
                  />
                ))}
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center space-x-2 sm:space-x-4">
                {!isRecording ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startRecording}
                    className="bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-8 rounded-xl transition-all duration-300 flex items-center"
                  >
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Start Recording
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopRecording}
                    className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-8 rounded-xl transition-all duration-300 flex items-center"
                  >
                    <Square className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Stop & Complete
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
                  {serviceStatus.overall ? 'Services Ready' : 'Services Offline'}
                </span>
                {isRecording && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="ml-2 w-2 h-2 bg-red-500 rounded-full"
                  />
                )}
              </h3>
              
              <div className="bg-primary-50 rounded-xl p-4 min-h-[200px] max-h-[300px] overflow-y-auto border border-primary-200">
                <AnimatePresence>
                  {isRecording ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-primary-900 leading-relaxed"
                    >
                      <div className="flex items-center space-x-2 mb-4">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-3 h-3 bg-red-500 rounded-full"
                        />
                        <span className="font-medium">Recording in progress...</span>
                      </div>
                      <p className="text-primary-700">
                        Speak clearly into your microphone. The audio will be transcribed to English text when you click "Stop & Complete".
                      </p>
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> After transcription, you can review the text and click "Generate Medical Summary" to analyze with ChatGPT.
                        </p>
                      </div>
                    </motion.div>
                  ) : isProcessing ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-primary-900 leading-relaxed"
                    >
                      <div className="flex items-center space-x-2 mb-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                        />
                        <span className="font-medium">Processing audio...</span>
                      </div>
                      <p className="text-primary-700">
                        Transcribing audio with Whisper and analyzing with Ollama. This may take a few moments.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-primary-600 italic"
                    >
                      Click "Start Recording" to begin the consultation. Audio will be processed when you click "Stop & Complete".
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Processing Overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="glass rounded-2xl p-8 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-primary-900 mb-2">
                  Processing Audio
                </h3>
                <p className="text-primary-600">
                  Transcribing audio with Whisper → Converting to English text...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Consultation;
