import { useState } from 'react';
import { useVoice } from '../contexts/VoiceContext';
import { VoiceName } from '../types/voice';

export const useVoiceSelection = () => {
  const { voiceMetadata } = useVoice();
  const [selectedVoice, setSelectedVoice] = useState<VoiceName | null>(null);

  const selectVoice = (voice: VoiceName) => {
    setSelectedVoice(voice);
  };

  const getVoiceMetadata = (voice: VoiceName) => {
    return voiceMetadata?.[voice] || null;
  };

  return {
    selectedVoice,
    selectVoice,
    getVoiceMetadata
  };
}; 