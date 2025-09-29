import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Activity
} from 'lucide-react';
import type { PreDiagnosisTest } from '../store/useStore';

interface PreDiagnosisCardsProps {
  tests?: PreDiagnosisTest[];
}

const PreDiagnosisCards: React.FC<PreDiagnosisCardsProps> = ({ tests = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll to update active indicator
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || tests.length === 0) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.scrollWidth / tests.length;
      const newActiveIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(newActiveIndex, tests.length - 1));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [tests.length]);

  if (!tests || tests.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-xl font-semibold text-primary-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Pre-Diagnosis Tests
        </h3>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-primary-300 mx-auto mb-4" />
          <p className="text-primary-500">No pre-diagnosis tests available for this patient</p>
          <p className="text-primary-400 text-sm mt-2">Recent test results will appear here</p>
        </div>
      </motion.div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'abnormal':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'abnormal':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'pending':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'abnormal':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderTestValues = (values: { [key: string]: string | number }) => {
    return Object.entries(values).map(([key, value]) => (
      <div key={key} className="flex justify-between items-center py-1">
        <span className="text-sm text-primary-600">{key}:</span>
        <span className="text-sm font-medium text-primary-900">{value}</span>
      </div>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <h3 className="text-xl font-semibold text-primary-900 mb-6 flex items-center">
        <Activity className="w-5 h-5 mr-2" />
        Pre-Diagnosis Tests
        <span className="ml-2 text-sm font-normal text-primary-500">
          ({tests.length} test{tests.length !== 1 ? 's' : ''})
        </span>
      </h3>

      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tests.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`relative border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-lg flex-shrink-0 w-full snap-start ${getStatusColor(test.status)}`}
          >
            {/* Test Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3" role="img" aria-label={test.name}>
                  {test.icon}
                </span>
                <div>
                  <h4 className="font-semibold text-primary-900 text-sm">{test.name}</h4>
                  <div className="flex items-center text-xs text-primary-500 mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(test.date)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                {getStatusIcon(test.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusBadgeColor(test.status)}`}>
                  {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Test Values */}
            <div className="space-y-1 mb-3">
              {renderTestValues(test.values)}
            </div>

            {/* Notes */}
            {test.notes && (
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-primary-600 italic">
                  <span className="font-medium">Notes:</span> {test.notes}
                </p>
              </div>
            )}

            {/* Status-specific indicators */}
            {test.status === 'critical' && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"
              />
            )}
            
            {test.status === 'abnormal' && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Navigation Indicators */}
      {tests.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {tests.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === activeIndex 
                  ? 'bg-primary-600 scale-125' 
                  : 'bg-primary-300 hover:bg-primary-400'
              }`}
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  const cardWidth = container.scrollWidth / tests.length;
                  container.scrollTo({
                    left: cardWidth * index,
                    behavior: 'smooth'
                  });
                }
              }}
              whileHover={{ scale: index === activeIndex ? 1.25 : 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 flex justify-center gap-6">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {tests.filter(t => t.status === 'normal').length}
          </div>
          <div className="text-xs text-primary-500">Normal</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-600">
            {tests.filter(t => t.status === 'abnormal').length}
          </div>
          <div className="text-xs text-primary-500">Abnormal</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">
            {tests.filter(t => t.status === 'critical').length}
          </div>
          <div className="text-xs text-primary-500">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {tests.filter(t => t.status === 'pending').length}
          </div>
          <div className="text-xs text-primary-500">Pending</div>
        </div>
      </div>

      {/* Quick Insights */}
      {tests.some(t => t.status === 'critical' || t.status === 'abnormal') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <div className="flex items-center text-amber-700">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">
              Attention Required: {tests.filter(t => t.status === 'critical' || t.status === 'abnormal').length} test{tests.filter(t => t.status === 'critical' || t.status === 'abnormal').length !== 1 ? 's' : ''} need follow-up
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PreDiagnosisCards;
