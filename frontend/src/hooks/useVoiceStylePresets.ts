import { useState, useEffect } from 'react';
import { VoiceStyle } from '../types/voice';
import { SpeakerConfig } from '../types/base';
import { getVoiceStylePresets } from '../services/api';

type VoiceStylePresetsType = Record<string, Partial<SpeakerConfig>>;

interface UseVoiceStylePresetsReturn {
  stylePresets: VoiceStylePresetsType;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useVoiceStylePresets = (): UseVoiceStylePresetsReturn => {
  const [stylePresets, setStylePresets] = useState<VoiceStylePresetsType>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStylePresets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const presets = await getVoiceStylePresets();
      setStylePresets(presets);
    } catch (err) {
      console.error('Error fetching voice style presets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load voice style presets');
      // Fallback to some default presets if the fetch fails
      setStylePresets({
        "neutral_professional": {
          "voice_tone": "professional",
          "speaking_rate": { "normal": 150, "excited": 160, "analytical": 140 }
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStylePresets();
  }, []);

  return {
    stylePresets,
    isLoading,
    error,
    refetch: fetchStylePresets
  };
}; 