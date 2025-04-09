import React, { createContext, useContext, useState } from 'react';
import { GenerationRequest } from '../types/audio';
import { useAudioGeneration } from '../hooks/useAudioGeneration';
import { useSegmentAudioGeneration } from '../hooks/useSegmentAudioGeneration';
import { SpeakerVoiceMapping } from '../types/speaker';

interface AudioContextType {
  // Full audio generation
  generateAudio: (request: GenerationRequest) => Promise<void>;
  isGenerating: boolean;
  updates: any[];
  hasError: boolean;
  isComplete: boolean;
  audioUrl: string | null;
  
  // Segment audio generation
  generateSegmentAudio: (speaker: string, text: string, voiceMappings: Record<string, SpeakerVoiceMapping>) => Promise<string>;
  isGeneratingSegment: boolean;
  segmentError: string | null;
  
  // Common functions
  clearAudioState: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode; apiBaseUrl?: string }> = ({ 
  children,
  apiBaseUrl = ''
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Pass apiBaseUrl to useAudioGeneration hook
  const {
    generateAudio: generateAudioHook,
    isGenerating,
    updates,
    hasError,
    isComplete
  } = useAudioGeneration(apiBaseUrl);
  
  // Use hook for segment audio generation
  const {
    generateSegmentAudio: generateSegmentAudioHook,
    isGenerating: isGeneratingSegment,
    error: segmentError
  } = useSegmentAudioGeneration(apiBaseUrl);

  const generateAudio = async (request: GenerationRequest) => {
    await generateAudioHook(request);
  };
  
  const generateSegmentAudio = async (
    speaker: string, 
    text: string, 
    voiceMappings: Record<string, SpeakerVoiceMapping>
  ): Promise<string> => {
    return await generateSegmentAudioHook(speaker, text, voiceMappings);
  };

  const clearAudioState = () => {
    setAudioUrl(null);
  };

  return (
    <AudioContext.Provider
      value={{
        // Full audio generation
        generateAudio,
        isGenerating,
        updates,
        hasError,
        isComplete,
        audioUrl,
        
        // Segment audio generation
        generateSegmentAudio,
        isGeneratingSegment,
        segmentError,
        
        // Common functions
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