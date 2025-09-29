import React from 'react';
import { motion } from 'framer-motion';
import { Search, User, Phone, Mail, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';

const PatientSelection: React.FC = () => {
  const { patients, setSelectedPatient, setCurrentScreen } = useStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientSelect = (patient: typeof patients[0]) => {
    setSelectedPatient(patient);
    setCurrentScreen('patient-details');
  };

  return (
    <div className="min-h-screen p-6 pt-20 sm:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-bold text-primary-900 mb-4"
          >
            CloudHew Health AI Transcript
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-primary-600 text-lg"
          >
            Select a patient to begin consultation
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search patients by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-primary-200 rounded-xl text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Patient Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredPatients.map((patient, index) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.6 }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePatientSelect(patient)}
            className="glass rounded-2xl p-4 sm:p-6 cursor-pointer hover:bg-white/20 transition-all duration-300 group"
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-primary-900 group-hover:text-secondary-600 transition-colors truncate">
                  {patient.name}
                </h3>
                <p className="text-sm sm:text-base text-primary-600">
                  {patient.age} years • {patient.gender}
                </p>
              </div>
            </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center text-primary-600">
                  <Phone className="w-4 h-4 mr-2 sm:mr-3 text-secondary-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{patient.phone}</span>
                </div>
                <div className="flex items-center text-primary-600">
                  <Mail className="w-4 h-4 mr-2 sm:mr-3 text-secondary-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{patient.email}</span>
                </div>
                <div className="flex items-center text-primary-600">
                  <Calendar className="w-4 h-4 mr-2 sm:mr-3 text-secondary-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Last visit: {patient.lastVisit}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-primary-200">
                <div className="flex flex-wrap gap-2">
                  {patient.medicalHistory.slice(0, 2).map((condition, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded-full"
                    >
                      {condition}
                    </span>
                  ))}
                  {patient.medicalHistory.length > 2 && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                      +{patient.medicalHistory.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              <motion.div
                className="mt-4 text-center"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-secondary-600 font-medium group-hover:text-secondary-700 transition-colors">
                  Select Patient →
                </span>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-12"
          >
            <div className="glass rounded-2xl p-8">
              <User className="w-16 h-16 text-primary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary-900 mb-2">No patients found</h3>
              <p className="text-primary-600">
                Try adjusting your search terms or check back later.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PatientSelection;
