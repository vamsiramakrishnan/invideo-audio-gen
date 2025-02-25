import React, { createContext, useContext, useState, useEffect } from 'react';
import { VoiceConfigurationOptions, VoiceMetadata } from '../types/voice';
import { getVoiceConfig, getVoiceMetadata } from '../services/api';

interface VoiceContextType {
  voiceOptions: VoiceConfigurationOptions | null;
  voiceMetadata: Record<string, VoiceMetadata> | null;
  isLoading: boolean;
  error: string | null;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [voiceOptions, setVoiceOptions] = useState<VoiceConfigurationOptions | null>(null);
  const [voiceMetadata, setVoiceMetadata] = useState<Record<string, VoiceMetadata> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVoiceConfig = async () => {
      try {
        const [options, metadata] = await Promise.all([
          getVoiceConfig(),
          getVoiceMetadata()
        ]);
        setVoiceOptions(options);
        setVoiceMetadata(metadata);
      } catch (error) {
        setError('Failed to load voice configuration');
        console.error('Error loading voice config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoiceConfig();
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        voiceOptions,
        voiceMetadata,
        isLoading,
        error
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}; 