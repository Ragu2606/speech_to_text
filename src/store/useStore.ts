import { create } from 'zustand';

export interface PreDiagnosisTest {
  id: string;
  type: 'blood_test' | 'eye_test' | 'blood_pressure' | 'ecg' | 'x_ray' | 'urine_test' | 'diabetes_test' | 'cholesterol_test';
  name: string;
  date: string;
  status: 'normal' | 'abnormal' | 'critical' | 'pending';
  values: { [key: string]: string | number };
  notes?: string;
  icon: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  medicalHistory: string[];
  familyHistory: string[];
  currentMedications: string[];
  allergies: string[];
  lastVisit: string;
  preDiagnosisTests?: PreDiagnosisTest[];
}

export interface ConsultationData {
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

export interface LiveTranscriptionResult {
  text: string;
  originalText: string;
  language: string;
  confidence: number;
  timestamp: number;
  isPartial: boolean;
  isFinal: boolean;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'doctor' | 'nurse' | 'admin';
  lastLogin: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  currentAuthStep: 'phone-input' | 'otp-verification' | 'authenticated';
  phoneNumber: string;
  otpCode: string;
  isLoading: boolean;
  error: string | null;
  otpExpiresAt: number | null;
}

export interface AppState {
  // Authentication state
  auth: AuthState;
  
  // Current screen state
  currentScreen: 'login' | 'patient-selection' | 'patient-details' | 'consultation' | 'realtime-consultation' | 'summary';
  
  // Patient data
  patients: Patient[];
  selectedPatient: Patient | null;
  
  // Consultation data
  isRecording: boolean;
  transcript: string;
  consultationData: ConsultationData | null;
  
  // Audio recording
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  
  // Live transcription
  liveTranscriptionResults: LiveTranscriptionResult[];
  isLiveTranscriptionActive: boolean;
  
  // Theme
  theme: 'light' | 'dark' | 'ocean' | 'forest';
  
  // Actions
  setCurrentScreen: (screen: AppState['currentScreen']) => void;
  setSelectedPatient: (patient: Patient | null) => void;
  setPatients: (patients: Patient[]) => void;
  setIsRecording: (recording: boolean) => void;
  setTranscript: (transcript: string) => void;
  setConsultationData: (data: ConsultationData | null) => void;
  setMediaRecorder: (recorder: MediaRecorder | null) => void;
  setAudioChunks: (chunks: Blob[]) => void;
  addToTranscript: (text: string) => void;
  clearTranscript: () => void;
  resetConsultation: () => void;
  
  // Live transcription actions
  setLiveTranscriptionResults: (results: LiveTranscriptionResult[]) => void;
  addLiveTranscriptionResult: (result: LiveTranscriptionResult) => void;
  setIsLiveTranscriptionActive: (active: boolean) => void;
  clearLiveTranscriptionResults: () => void;
  toggleDarkMode: () => void;
  setTheme: (theme: 'light' | 'dark' | 'ocean' | 'forest') => void;
  
  // Auth actions
  setPhoneNumber: (phone: string) => void;
  setOtpCode: (otp: string) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  setAuthStep: (step: AuthState['currentAuthStep']) => void;
  sendOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
  initializeAuth: () => void;
}

// Mock users for authentication
const mockUsers: User[] = [
  {
    id: 'U001',
    phone: '+1234567890',
    name: 'Dr. Rajesh Patel',
    role: 'doctor',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'U002',
    phone: '+9876543210',
    name: 'Nurse Priya Kumari',
    role: 'nurse',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'U003',
    phone: '+1111111111',
    name: 'Admin Arjun Singh',
    role: 'admin',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'U004',
    phone: '+9999999999',
    name: 'Dr. Ananya Sharma',
    role: 'doctor',
    lastLogin: new Date().toISOString()
  }
];

// Mock patient data - Comprehensive demo dataset
const mockPatients: Patient[] = [
  {
    id: 'P001',
    name: 'Sunita Devi',
    age: 45,
    gender: 'Female',
    phone: '+91-9876543210',
    email: 'sunita.devi@email.com',
    medicalHistory: ['Hypertension', 'Type 2 Diabetes', 'High Cholesterol'],
    familyHistory: ['Diabetes mellitus (father)', 'Hypertension (mother)', 'Heart disease (paternal grandfather)'],
    currentMedications: ['Metformin 1000mg BD', 'Lisinopril 10mg OD', 'Atorvastatin 20mg OD'],
    allergies: ['Penicillin', 'Shellfish', 'Latex'],
    lastVisit: '2025-01-15',
    preDiagnosisTests: [
      {
        id: 'T001',
        type: 'blood_test',
        name: 'Complete Blood Count',
        date: '2025-01-10',
        status: 'abnormal',
        values: { 'Hemoglobin': '10.2 g/dL', 'WBC': '12,500/μL', 'Platelets': '150,000/μL' },
        notes: 'Low hemoglobin, elevated WBC count',
        icon: '🩸'
      },
      {
        id: 'T002',
        type: 'blood_pressure',
        name: 'Blood Pressure Check',
        date: '2025-01-12',
        status: 'critical',
        values: { 'Systolic': 165, 'Diastolic': 95, 'Heart Rate': 88 },
        notes: 'Hypertensive crisis risk',
        icon: '❤️'
      },
      {
        id: 'T003',
        type: 'diabetes_test',
        name: 'HbA1c Test',
        date: '2025-01-08',
        status: 'abnormal',
        values: { 'HbA1c': '8.2%', 'Glucose': '180 mg/dL' },
        notes: 'Poor diabetes control',
        icon: '🩺'
      },
      {
        id: 'T004',
        type: 'cholesterol_test',
        name: 'Lipid Panel',
        date: '2025-01-05',
        status: 'abnormal',
        values: { 'Total': '280 mg/dL', 'LDL': '190 mg/dL', 'HDL': '35 mg/dL' },
        notes: 'High cholesterol, low HDL',
        icon: '🫀'
      }
    ]
  },
  {
    id: 'P002',
    name: 'Rajesh Kumar',
    age: 32,
    gender: 'Male',
    phone: '+91-9876543211',
    email: 'rajesh.kumar@email.com',
    medicalHistory: ['Asthma', 'Seasonal Allergies', 'Migraine'],
    familyHistory: ['Asthma (mother)', 'Migraine (sister)'],
    currentMedications: ['Salbutamol inhaler PRN', 'Fluticasone nasal spray OD', 'Sumatriptan 50mg PRN'],
    allergies: ['Pollen', 'Dust Mites'],
    lastVisit: '2025-01-12',
    preDiagnosisTests: [
      {
        id: 'T005',
        type: 'eye_test',
        name: 'Visual Acuity Test',
        date: '2025-01-11',
        status: 'normal',
        values: { 'Right Eye': '20/20', 'Left Eye': '20/25', 'Pressure': '14 mmHg' },
        notes: 'Slight myopia in left eye',
        icon: '👁️'
      },
      {
        id: 'T006',
        type: 'blood_pressure',
        name: 'Blood Pressure Check',
        date: '2025-01-12',
        status: 'normal',
        values: { 'Systolic': 118, 'Diastolic': 76, 'Heart Rate': 72 },
        notes: 'Normal range',
        icon: '❤️'
      },
      {
        id: 'T007',
        type: 'urine_test',
        name: 'Urinalysis',
        date: '2025-01-09',
        status: 'normal',
        values: { 'Protein': 'Negative', 'Glucose': 'Negative', 'Specific Gravity': '1.020' },
        notes: 'All parameters normal',
        icon: '🧪'
      }
    ]
  },
  {
    id: 'P003',
    name: 'Lakshmi Nair',
    age: 58,
    gender: 'Female',
    phone: '+91-9876543212',
    email: 'lakshmi.nair@email.com',
    medicalHistory: ['Heart Disease', 'Osteoporosis', 'Arthritis'],
    familyHistory: ['Heart disease (father, brother)', 'Osteoporosis (mother)'],
    currentMedications: ['Bisoprolol 2.5mg OD', 'Alendronic acid 70mg weekly', 'Calcium + Vitamin D3 OD'],
    allergies: ['Aspirin', 'Ibuprofen'],
    lastVisit: '2025-01-10',
    preDiagnosisTests: [
      {
        id: 'T008',
        type: 'ecg',
        name: 'Electrocardiogram',
        date: '2025-01-09',
        status: 'abnormal',
        values: { 'Heart Rate': '92 bpm', 'Rhythm': 'Irregular', 'QT Interval': '440 ms' },
        notes: 'Atrial fibrillation detected',
        icon: '📈'
      },
      {
        id: 'T009',
        type: 'x_ray',
        name: 'Chest X-Ray',
        date: '2025-01-08',
        status: 'normal',
        values: { 'Lungs': 'Clear', 'Heart Size': 'Normal', 'Bones': 'Intact' },
        notes: 'No acute abnormalities',
        icon: '📡'
      },
      {
        id: 'T010',
        type: 'blood_test',
        name: 'Cardiac Enzymes',
        date: '2025-01-07',
        status: 'critical',
        values: { 'Troponin I': '2.5 ng/mL', 'CK-MB': '45 U/L', 'BNP': '850 pg/mL' },
        notes: 'Elevated cardiac markers indicating heart stress',
        icon: '🩸'
      }
    ]
  },
  {
    id: 'P004',
    name: 'Arjun Reddy',
    age: 28,
    gender: 'Male',
    phone: '+91-9876543213',
    email: 'arjun.reddy@email.com',
    medicalHistory: ['Anxiety Disorder', 'Depression', 'Insomnia'],
    familyHistory: ['Depression (mother)', 'Anxiety (sister)'],
    currentMedications: ['Sertraline 50mg OD', 'Lorazepam 0.5mg PRN', 'Melatonin 3mg at bedtime'],
    allergies: ['None known'],
    lastVisit: '2025-01-08',
    preDiagnosisTests: [
      {
        id: 'T011',
        type: 'blood_test',
        name: 'Complete Metabolic Panel',
        date: '2025-01-06',
        status: 'normal',
        values: { 'Sodium': '140 mEq/L', 'Potassium': '4.0 mEq/L', 'Glucose': '85 mg/dL' },
        notes: 'All metabolic markers within normal range',
        icon: '🩸'
      },
      {
        id: 'T012',
        type: 'blood_pressure',
        name: 'Blood Pressure Check',
        date: '2025-01-07',
        status: 'normal',
        values: { 'Systolic': 110, 'Diastolic': 70, 'Heart Rate': 68 },
        notes: 'Optimal blood pressure',
        icon: '❤️'
      }
    ]
  },
  {
    id: 'P005',
    name: 'Kamala Bhat',
    age: 67,
    gender: 'Female',
    phone: '+91-9876543214',
    email: 'kamala.bhat@email.com',
    medicalHistory: ['Breast Cancer (Remission)', 'Osteoporosis', 'Hypertension'],
    familyHistory: ['Breast cancer (sister)', 'Ovarian cancer (maternal aunt)'],
    currentMedications: ['Tamoxifen 20mg OD', 'Amlodipine 5mg OD', 'Calcium carbonate 500mg BD'],
    allergies: ['Contrast Dye', 'Sulfa'],
    lastVisit: '2025-01-05'
  },
  {
    id: 'P006',
    name: 'Vikram Singh',
    age: 41,
    gender: 'Male',
    phone: '+91-9876543215',
    email: 'vikram.singh@email.com',
    medicalHistory: ['GERD', 'Sleep Apnea', 'Obesity'],
    familyHistory: ['Diabetes (father)', 'Hypertension (both parents)'],
    currentMedications: ['Omeprazole 20mg OD', 'CPAP therapy nightly'],
    allergies: ['Peanuts', 'Tree Nuts'],
    lastVisit: '2025-01-03'
  },
  {
    id: 'P007',
    name: 'Meera Gupta',
    age: 35,
    gender: 'Female',
    phone: '+91-9876543216',
    email: 'meera.gupta@email.com',
    medicalHistory: ['PCOS', 'Hypothyroidism', 'Anemia'],
    familyHistory: ['Thyroid disease (mother)', 'PCOS (sister)'],
    currentMedications: ['Levothyroxine 75mcg OD', 'Metformin 500mg BD', 'Folate 5mg OD'],
    allergies: ['Iron Supplements'],
    lastVisit: '2025-01-01'
  },
  {
    id: 'P008',
    name: 'Suresh Iyer',
    age: 52,
    gender: 'Male',
    phone: '+91-9876543217',
    email: 'suresh.iyer@email.com',
    medicalHistory: ['Prostate Cancer', 'Diabetes Type 2', 'High Blood Pressure'],
    familyHistory: ['Prostate cancer (father)', 'Diabetes (father)', 'Heart disease (brother)'],
    currentMedications: ['Bicalutamide 50mg OD', 'Metformin 1000mg BD', 'Ramipril 5mg OD', 'Gliclazide 80mg BD'],
    allergies: ['Morphine', 'Codeine'],
    lastVisit: '2025-01-01'
  }
];

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  auth: {
    isAuthenticated: false,
    user: null,
    currentAuthStep: 'phone-input',
    phoneNumber: '',
    otpCode: '',
    isLoading: false,
    error: null,
    otpExpiresAt: null
  },
  currentScreen: 'login',
  patients: mockPatients,
  selectedPatient: null,
  isRecording: false,
  transcript: '',
  consultationData: null,
  mediaRecorder: null,
  audioChunks: [],
  liveTranscriptionResults: [],
  isLiveTranscriptionActive: false,
  theme: 'light',

  // Actions
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  
  setSelectedPatient: (patient) => set({ selectedPatient: patient }),
  
  setPatients: (patients) => set({ patients }),
  
  setIsRecording: (recording) => set({ isRecording: recording }),
  
  setTranscript: (transcript) => set({ transcript }),
  
  setConsultationData: (data) => set({ consultationData: data }),
  
  setMediaRecorder: (recorder) => set({ mediaRecorder: recorder }),
  
  setAudioChunks: (chunks) => set({ audioChunks: chunks }),
  
  addToTranscript: (text) => {
    const currentTranscript = get().transcript;
    set({ transcript: currentTranscript + ' ' + text });
  },
  
  clearTranscript: () => set({ transcript: '' }),
  
  resetConsultation: () => set({
    isRecording: false,
    transcript: '',
    consultationData: null,
    mediaRecorder: null,
    audioChunks: [],
    liveTranscriptionResults: [],
    isLiveTranscriptionActive: false
  }),
  
  // Live transcription actions
  setLiveTranscriptionResults: (results) => set({ liveTranscriptionResults: results }),
  
  addLiveTranscriptionResult: (result) => {
    const currentResults = get().liveTranscriptionResults;
    set({ liveTranscriptionResults: [...currentResults, result] });
  },
  
  setIsLiveTranscriptionActive: (active) => set({ isLiveTranscriptionActive: active }),
  
  clearLiveTranscriptionResults: () => set({ liveTranscriptionResults: [] }),
  
  toggleDarkMode: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setTheme: (theme) => {
    set({ theme });
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
  },

  // Auth actions
  setPhoneNumber: (phone) => {
    set(state => ({
      auth: { ...state.auth, phoneNumber: phone, error: null }
    }));
  },

  setOtpCode: (otp) => {
    set(state => ({
      auth: { ...state.auth, otpCode: otp, error: null }
    }));
  },

  setAuthLoading: (loading) => {
    set(state => ({
      auth: { ...state.auth, isLoading: loading }
    }));
  },

  setAuthError: (error) => {
    set(state => ({
      auth: { ...state.auth, error, isLoading: false }
    }));
  },

  setAuthStep: (step) => {
    set(state => ({
      auth: { ...state.auth, currentAuthStep: step, error: null }
    }));
  },

  sendOtp: async (phone) => {
    const { setAuthLoading, setAuthError, setAuthStep } = get();
    
    setAuthLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if phone number exists in mock users
      const user = mockUsers.find(u => u.phone === phone);
      if (!user) {
        setAuthError('Phone number not registered. Please contact admin.');
        return false;
      }

      // Mock OTP generation
      const otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      
      set(state => ({
        auth: {
          ...state.auth,
          phoneNumber: phone,
          otpExpiresAt,
          isLoading: false,
          error: null
        }
      }));

      setAuthStep('otp-verification');
      
      // In real app, send OTP via SMS
      console.log(`Mock OTP for ${phone}: 123456`);
      
      return true;
    } catch (error) {
      setAuthError('Failed to send OTP. Please try again.');
      return false;
    }
  },

  verifyOtp: async (otp) => {
    const { setAuthLoading, setAuthError, auth } = get();
    
    setAuthLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check OTP expiry
      if (auth.otpExpiresAt && Date.now() > auth.otpExpiresAt) {
        setAuthError('OTP has expired. Please request a new one.');
        return false;
      }

      // Mock OTP verification (accept 123456 for demo)
      if (otp !== '123456') {
        setAuthError('Invalid OTP. Please try again.');
        return false;
      }

      // Find user by phone number
      const user = mockUsers.find(u => u.phone === auth.phoneNumber);
      if (!user) {
        setAuthError('User not found. Please contact admin.');
        return false;
      }

      // Update user's last login
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };

      // Set authenticated state
      set(state => ({
        auth: {
          ...state.auth,
          isAuthenticated: true,
          user: updatedUser,
          currentAuthStep: 'authenticated',
          isLoading: false,
          error: null,
          otpCode: '',
          otpExpiresAt: null
        },
        currentScreen: 'patient-selection'
      }));

      // Store auth state in localStorage
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      localStorage.setItem('authToken', 'mock-jwt-token');
      
      return true;
    } catch (error) {
      setAuthError('Verification failed. Please try again.');
      return false;
    }
  },

  logout: () => {
    set(() => ({
      auth: {
        isAuthenticated: false,
        user: null,
        currentAuthStep: 'phone-input',
        phoneNumber: '',
        otpCode: '',
        isLoading: false,
        error: null,
        otpExpiresAt: null
      },
      currentScreen: 'login'
    }));

    // Clear localStorage
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
  },

  initializeAuth: () => {
    const savedUser = localStorage.getItem('authUser');
    const savedToken = localStorage.getItem('authToken');

    if (savedUser && savedToken) {
      try {
        const user = JSON.parse(savedUser);
        set(state => ({
          auth: {
            ...state.auth,
            isAuthenticated: true,
            user,
            currentAuthStep: 'authenticated'
          },
          currentScreen: 'patient-selection'
        }));
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        get().logout();
      }
    }
  }
}));
