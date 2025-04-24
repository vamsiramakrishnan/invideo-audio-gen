import { useState, useEffect } from 'react';
import { SpeakerConfig } from '../types/base';
import { VoiceName } from '../types/voice';
import { VOICE_CONFIGS } from '../config/voices';
import { getSpeakerMappings } from '../services/api';
import { getSpeakerConfigForVoice, createVoiceConfig } from '../utils/voiceUtils';

/**
 * Hook to manage voice to speaker mappings
 * @returns Object containing speaker mappings and utility functions
 */
export const useVoiceSpeakerMapping = () => {
  const [speakerMappings, setSpeakerMappings] = useState<Record<string, SpeakerConfig>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch speaker mappings on component mount
  useEffect(() => {
    const fetchSpeakerMappings = async () => {
      try {
        setIsLoading(true);
        const mappings = await getSpeakerMappings();
        setSpeakerMappings(mappings);
        setError(null);
      } catch (err) {
        setError('Failed to load speaker mappings');
        console.error('Error fetching speaker mappings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpeakerMappings();
  }, []);

  /**
   * Get a speaker config for a given voice name
   * @param voiceName The voice name to get config for
   * @returns Speaker config or undefined if not found
   */
  const getSpeakerForVoice = (voiceName: VoiceName): SpeakerConfig | undefined => {
    return getSpeakerConfigForVoice(voiceName, speakerMappings);
  };

  /**
   * Get all available voice names from config and speaker mappings
   * @returns Array of all available voice names
   */
  const getAllVoiceNames = (): VoiceName[] => {
    // Return all voice names from VOICE_CONFIGS
    return Object.keys(VOICE_CONFIGS) as VoiceName[];
  };

  /**
   * Get voice names that have predefined speaker configurations
   * @returns Array of voice names with configs
   */
  const getVoicesWithConfigs = (): VoiceName[] => {
    const voices = new Set<VoiceName>();
    
    Object.values(speakerMappings).forEach(config => {
      if (config.voice) {
        voices.add(config.voice as VoiceName);
      }
    });
    
    return Array.from(voices);
  };

  /**
   * Create a default speaker config for a voice that doesn't have a predefined one
   * @param voiceName The voice to create a config for
   * @returns A new speaker configuration
   */
  const createDefaultSpeakerConfig = (voiceName: VoiceName): SpeakerConfig => {
    // Ensure voice name is available as a VoiceName enum value
    if (!Object.keys(VOICE_CONFIGS).includes(voiceName)) {
      console.warn(`Creating config for unknown voice: ${voiceName}`);
    }
    
    // Return a new default config for this voice
    return {
      name: `Default ${voiceName}`,
      age: 35,
      gender: 'neutral',
      persona: 'Podcast Speaker',
      background: 'Experienced in the topic',
      voice_tone: 'professional',
      accent: 'neutral',
      voice: voiceName,
      speaking_rate: {
        normal: 150,
        excited: 170,
        analytical: 130
      },
      voice_characteristics: {
        pitch_range: 'medium',
        resonance: 'mixed',
        breathiness: 'low',
        vocal_energy: 'moderate',
        pause_pattern: 'natural',
        emphasis_pattern: 'balanced',
        emotional_range: 'neutral',
        breathing_pattern: 'relaxed'
      },
      speech_patterns: {
        phrasing: 'natural',
        rhythm: 'regular',
        articulation: 'clear',
        modulation: 'subtle'
      }
    };
  };

  return {
    speakerMappings,
    isLoading,
    error,
    getSpeakerForVoice,
    getAllVoiceNames,
    getVoicesWithConfigs,
    createDefaultSpeakerConfig
  };
}; 