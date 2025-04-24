import { SpeakerConfig } from '../types/base';
import { VoiceName, VoiceConfig } from '../types/voice';

/**
 * Get a speaker configuration for a given voice name from the available mappings
 * @param voiceName The name of the voice to get configuration for
 * @param speakerMappings The available speaker mappings
 * @returns A speaker configuration for the voice, or undefined if not found
 */
export const getSpeakerConfigForVoice = (
  voiceName: VoiceName,
  speakerMappings: Record<string, SpeakerConfig>
): SpeakerConfig | undefined => {
  // Find the first speaker that uses this voice
  const speaker = Object.values(speakerMappings).find(
    config => config.voice === voiceName
  );
  
  return speaker;
};

/**
 * Create a voice configuration for a specified voice, using either an existing
 * speaker config or default values
 * @param voiceName The name of the voice
 * @param speakerMappings Available speaker mappings
 * @param overrides Properties to override in the speaker config
 * @returns A complete voice configuration
 */
export const createVoiceConfig = (
  voiceName: VoiceName,
  speakerMappings: Record<string, SpeakerConfig>,
  overrides: Partial<SpeakerConfig> = {}
): VoiceConfig => {
  // Get base config from existing speaker if available
  const baseConfig = getSpeakerConfigForVoice(voiceName, speakerMappings);
  
  // Create default config if no existing mapping is found
  const defaultConfig: SpeakerConfig = {
    name: `Speaker using ${voiceName}`,
    age: 35,
    gender: 'neutral',
    persona: 'Conversational Speaker',
    background: 'Experienced in the topic',
    voice_tone: 'professional',
    accent: 'neutral',
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
  
  // Combine base or default config with overrides
  const config = {
    ...(baseConfig || defaultConfig),
    ...overrides
  };
  
  return {
    voice: voiceName,
    config
  };
};

/**
 * Extract voice name from a speaker configuration
 * @param speakerConfig The speaker configuration
 * @returns The voice name if available, or undefined
 */
export const getVoiceNameFromSpeakerConfig = (
  speakerConfig: SpeakerConfig
): VoiceName | undefined => {
  return speakerConfig.voice as VoiceName;
}; 