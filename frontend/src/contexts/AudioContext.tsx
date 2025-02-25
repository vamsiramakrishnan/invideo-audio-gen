import React, { createContext, useContext, useState } from 'react';
import { GenerationRequest } from '../types/audio';
import { useAudioGeneration } from '../hooks/useAudioGeneration';

interface AudioContextType {
  generateAudio: (request: GenerationRequest) => Promise<void>;
  isGenerating: boolean;
  updates: any[];
  hasError: boolean;
  isComplete: boolean;
  audioUrl: string | null;
  clearAudioState: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const {
    generateAudio: generateAudioHook,
    isGenerating,
    updates,
    hasError,
    isComplete
  } = useAudioGeneration();

  const generateAudio = async (request: GenerationRequest) => {
    await generateAudioHook(request);
  };

  const clearAudioState = () => {
    setAudioUrl(null);
  };

  return (
    <AudioContext.Provider
      value={{
        generateAudio,
        isGenerating,
        updates,
        hasError,
        isComplete,
        audioUrl,
        clearAudioState
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}; 