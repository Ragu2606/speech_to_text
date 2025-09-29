import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Heart, 
  AlertTriangle,
  FileText,
  Play,
  Mic
} from 'lucide-react';
import { useStore } from '../store/useStore';
import PreDiagnosisCards from './PreDiagnosisCards';

const PatientDetails: React.FC = () => {
  const { selectedPatient, setCurrentScreen, setSelectedPatient } = useStore();

  if (!selectedPatient) {
    return null;
  }

  const handleBack = () => {
    setSelectedPatient(null);
    setCurrentScreen('patient-selection');
  };

  const handleStartConsultation = () => {
    setCurrentScreen('consultation');
  };

  const handleStartRealtimeConsultation = () => {
    setCurrentScreen('realtime-consultation');
  };

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
          className="flex items-center mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="glass rounded-xl p-3 mr-4 hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-primary-600" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-primary-900">Patient Details</h1>
            <p className="text-primary-600">Review patient information before consultation</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Patient Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="glass rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-primary-900 truncate">{selectedPatient.name}</h2>
                  <p className="text-primary-600 text-base sm:text-lg">
                    {selectedPatient.age} years • {selectedPatient.gender}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center p-4 bg-primary-50 rounded-xl">
                  <Phone className="w-5 h-5 text-secondary-500 mr-3" />
                  <div>
                    <p className="text-primary-500 text-sm">Phone</p>
                    <p className="text-primary-900 font-medium">{selectedPatient.phone}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-primary-50 rounded-xl">
                  <Mail className="w-5 h-5 text-secondary-500 mr-3" />
                  <div>
                    <p className="text-primary-500 text-sm">Email</p>
                    <p className="text-primary-900 font-medium">{selectedPatient.email}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-primary-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-secondary-500 mr-3" />
                  <div>
                    <p className="text-primary-500 text-sm">Last Visit</p>
                    <p className="text-primary-900 font-medium">{selectedPatient.lastVisit}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-primary-50 rounded-xl">
                  <FileText className="w-5 h-5 text-secondary-500 mr-3" />
                  <div>
                    <p className="text-primary-500 text-sm">Patient ID</p>
                    <p className="text-primary-900 font-medium">{selectedPatient.id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="glass rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center mb-4">
                <Heart className="w-6 h-6 text-accent-500 mr-3" />
                <h3 className="text-xl font-semibold text-primary-900">Medical History</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPatient.medicalHistory.map((condition, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                    className="px-3 py-2 bg-accent-100 text-accent-700 rounded-full text-sm"
                  >
                    {condition}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Allergies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="glass rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-accent-500 mr-3" />
                <h3 className="text-xl font-semibold text-primary-900">Allergies</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPatient.allergies.length > 0 ? (
                  selectedPatient.allergies.map((allergy, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      className="px-3 py-2 bg-accent-100 text-accent-700 rounded-full text-sm"
                    >
                      {allergy}
                    </motion.span>
                  ))
                ) : (
                  <span className="text-primary-500">No known allergies</span>
                )}
              </div>
            </motion.div>

            {/* Family History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="glass rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center mb-4">
                <User className="w-6 h-6 text-blue-500 mr-3" />
                <h3 className="text-xl font-semibold text-primary-900">Family History</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPatient.familyHistory?.length > 0 ? (
                  selectedPatient.familyHistory.map((condition, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {condition}
                    </motion.span>
                  ))
                ) : (
                  <span className="text-primary-500">No significant family history</span>
                )}
              </div>
            </motion.div>

            {/* Current Medications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="glass rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-xl font-semibold text-primary-900">Current Medications</h3>
              </div>
              <div className="space-y-2">
                {selectedPatient.currentMedications?.length > 0 ? (
                  selectedPatient.currentMedications.map((medication, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800"
                    >
                      {medication}
                    </motion.div>
                  ))
                ) : (
                  <span className="text-primary-500">No current medications</span>
                )}
              </div>
            </motion.div>

            {/* Pre-Diagnosis Tests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <PreDiagnosisCards tests={selectedPatient?.preDiagnosisTests} />
            </motion.div>
          </motion.div>

          {/* Action Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="glass rounded-2xl p-6 sticky top-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-6 text-center">
                Consultation Actions
              </h3>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartConsultation}
                className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center mb-3"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Consultation (Post-Recording)
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartRealtimeConsultation}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center mb-4"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Real-time Consultation
              </motion.button>

              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-xl">
                  <h4 className="text-primary-900 font-medium mb-2">Quick Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-primary-600">
                      <span>Age:</span>
                      <span>{selectedPatient.age} years</span>
                    </div>
                    <div className="flex justify-between text-primary-600">
                      <span>Conditions:</span>
                      <span>{selectedPatient.medicalHistory.length}</span>
                    </div>
                    <div className="flex justify-between text-primary-600">
                      <span>Allergies:</span>
                      <span>{selectedPatient.allergies.length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-secondary-50 rounded-xl">
                  <h4 className="text-secondary-700 font-medium mb-2">Consultation Notes</h4>
                  <p className="text-secondary-600 text-sm">
                    This consultation will be recorded and transcribed automatically. 
                    All data will be securely stored and can be reviewed later.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PatientDetails;
