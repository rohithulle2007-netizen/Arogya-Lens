import React, { createContext, useContext, useState } from 'react';
import { ImageQualityResult, ScreeningResultData } from '../types/screening';
import { screeningService } from '../services/api/screeningService';

interface ScreeningContextType {
  capturedImage: string | null;
  qualityResult: ImageQualityResult | null;
  screeningResult: ScreeningResultData | null;
  reportedSymptoms: string[];
  isProcessingQuality: boolean;
  isAnalyzingScreening: boolean;
  error: string | null;
  setCapturedImage: (image: string | null) => void;
  setReportedSymptoms: (symptoms: string[]) => void;
  toggleSymptom: (symptom: string) => void;
  runQualityCheck: () => Promise<ImageQualityResult | null>;
  runScreeningAnalysis: () => Promise<ScreeningResultData | null>;
  resetScreening: () => void;
  clearError: () => void;
}

const ScreeningContext = createContext<ScreeningContextType | undefined>(undefined);

export const ScreeningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Image is held strictly in volatile component state, NEVER saved into localStorage for privacy/security
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null);
  const [screeningResult, setScreeningResult] = useState<ScreeningResultData | null>(null);
  const [reportedSymptoms, setReportedSymptoms] = useState<string[]>(['Fatigue', 'Dizziness']);
  const [isProcessingQuality, setIsProcessingQuality] = useState(false);
  const [isAnalyzingScreening, setIsAnalyzingScreening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSymptom = (symptom: string) => {
    setReportedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const runQualityCheck = async (): Promise<ImageQualityResult | null> => {
    if (!capturedImage) {
      setError('No captured image found to verify.');
      return null;
    }
    setIsProcessingQuality(true);
    setError(null);
    try {
      const result = await screeningService.checkImageQuality(capturedImage);
      setQualityResult(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Image quality evaluation failed');
      return null;
    } finally {
      setIsProcessingQuality(false);
    }
  };

  const runScreeningAnalysis = async (): Promise<ScreeningResultData | null> => {
    if (!capturedImage) {
      setError('No captured image available for anaemia analysis.');
      return null;
    }
    setIsAnalyzingScreening(true);
    setError(null);
    try {
      const result = await screeningService.analyzeScreening(capturedImage, reportedSymptoms);
      setScreeningResult(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Screening analysis failed');
      return null;
    } finally {
      setIsAnalyzingScreening(false);
    }
  };

  const resetScreening = () => {
    setCapturedImage(null);
    setQualityResult(null);
    setScreeningResult(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <ScreeningContext.Provider
      value={{
        capturedImage,
        qualityResult,
        screeningResult,
        reportedSymptoms,
        isProcessingQuality,
        isAnalyzingScreening,
        error,
        setCapturedImage,
        setReportedSymptoms,
        toggleSymptom,
        runQualityCheck,
        runScreeningAnalysis,
        resetScreening,
        clearError,
      }}
    >
      {children}
    </ScreeningContext.Provider>
  );
};

export const useScreening = () => {
  const context = useContext(ScreeningContext);
  if (!context) {
    throw new Error('useScreening must be used within a ScreeningProvider');
  }
  return context;
};
