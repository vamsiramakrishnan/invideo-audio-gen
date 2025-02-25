import {
  Gender,
  AccentType,
  VoiceTone,
  SpeakingRate,
  VoiceCharacteristics as BaseVoiceCharacteristics,
  SpeechPatterns as BaseSpeechPatterns,
  SpeakerConfig
} from './base';

// Re-export types from base
export type { VoiceCharacteristics, SpeechPatterns } from './base';

// Voice name type - matching backend config.py
export type VoiceName = 
  | 'Puck'    // Playful and energetic voice
  | 'Charon'  // Deep and mysterious voice
  | 'Aoede'   // Melodic and musical voice
  | 'Zephyr'  // Swift and airy voice
  | 'Fenrir'  // Powerful and commanding voice
  | 'Leda'    // Gentle and soothing voice
  | 'Orus'    // Wise and authoritative voice
  | 'Kore';   // Gentle and nurturing voice

// Predefined voice styles
export type VoiceStyle = 
  | 'neutral_professional'
  | 'warm_casual'
  | 'authoritative_formal'
  | 'friendly_conversational'
  | 'energetic_dynamic'
  | 'calm_soothing'
  | 'analytical_precise'
  | 'storytelling_engaging';

// Predefined voice style configurations
export const VOICE_STYLE_PRESETS: Record<VoiceStyle, Partial<SpeakerConfig>> = {
  neutral_professional: {
    voice_tone: 'professional',
    speaking_rate: { normal: 150, excited: 160, analytical: 140 },
    voice_characteristics: {
      pitch_range: 'medium',
      resonance: 'balanced',
      breathiness: 'low',
      vocal_energy: 'medium',
      pause_pattern: 'natural',
      emphasis_pattern: 'standard',
      emotional_range: 'balanced',
      breathing_pattern: 'subtle'
    }
  },
  warm_casual: {
    voice_tone: 'warm',
    speaking_rate: { normal: 160, excited: 175, analytical: 145 },
    voice_characteristics: {
      pitch_range: 'wide',
      resonance: 'warm',
      breathiness: 'medium',
      vocal_energy: 'high',
      pause_pattern: 'natural',
      emphasis_pattern: 'dynamic',
      emotional_range: 'dynamic',
      breathing_pattern: 'natural'
    }
  },
  authoritative_formal: {
    voice_tone: 'authoritative',
    speaking_rate: { normal: 140, excited: 155, analytical: 135 },
    voice_characteristics: {
      pitch_range: 'narrow',
      resonance: 'strong',
      breathiness: 'low',
      vocal_energy: 'high',
      pause_pattern: 'extended',
      emphasis_pattern: 'strong',
      emotional_range: 'limited',
      breathing_pattern: 'subtle'
    }
  },
  friendly_conversational: {
    voice_tone: 'warm',
    speaking_rate: { normal: 155, excited: 170, analytical: 145 },
    voice_characteristics: {
      pitch_range: 'wide',
      resonance: 'balanced',
      breathiness: 'medium',
      vocal_energy: 'medium',
      pause_pattern: 'natural',
      emphasis_pattern: 'dynamic',
      emotional_range: 'dynamic',
      breathing_pattern: 'natural'
    }
  },
  energetic_dynamic: {
    voice_tone: 'energetic',
    speaking_rate: { normal: 165, excited: 180, analytical: 150 },
    voice_characteristics: {
      pitch_range: 'wide',
      resonance: 'strong',
      breathiness: 'low',
      vocal_energy: 'high',
      pause_pattern: 'minimal',
      emphasis_pattern: 'strong',
      emotional_range: 'dynamic',
      breathing_pattern: 'pronounced'
    }
  },
  calm_soothing: {
    voice_tone: 'calm',
    speaking_rate: { normal: 135, excited: 145, analytical: 130 },
    voice_characteristics: {
      pitch_range: 'narrow',
      resonance: 'soft',
      breathiness: 'high',
      vocal_energy: 'low',
      pause_pattern: 'extended',
      emphasis_pattern: 'light',
      emotional_range: 'limited',
      breathing_pattern: 'subtle'
    }
  },
  analytical_precise: {
    voice_tone: 'professional',
    speaking_rate: { normal: 145, excited: 155, analytical: 140 },
    voice_characteristics: {
      pitch_range: 'narrow',
      resonance: 'balanced',
      breathiness: 'low',
      vocal_energy: 'medium',
      pause_pattern: 'extended',
      emphasis_pattern: 'strong',
      emotional_range: 'limited',
      breathing_pattern: 'subtle'
    }
  },
  storytelling_engaging: {
    voice_tone: 'warm',
    speaking_rate: { normal: 150, excited: 170, analytical: 140 },
    voice_characteristics: {
      pitch_range: 'wide',
      resonance: 'warm',
      breathiness: 'medium',
      vocal_energy: 'high',
      pause_pattern: 'natural',
      emphasis_pattern: 'dynamic',
      emotional_range: 'dynamic',
      breathing_pattern: 'natural'
    }
  }
};

// UI metadata
export interface VoiceMetadata {
  icon: string;
  color: string;
  description: string;
  tags: string[];
}

// Voice configuration
export interface VoiceConfig {
  voice: VoiceName;
  config: SpeakerConfig;
}

// Available options from backend
export interface VoiceConfigurationOptions {
  age_range: [number, number];
  genders: Gender[];
  accents: AccentType[];
  voice_tones: VoiceTone[];
  speaking_rate_ranges: {
    normal: [number, number];
    excited: [number, number];
    analytical: [number, number];
  };
  voice_characteristics_options: {
    [K in keyof BaseVoiceCharacteristics]: string[];
  };
  speech_patterns_options: {
    [K in keyof BaseSpeechPatterns]: string[];
  };
}

// Voice mapping for API requests
export type VoiceMappings = Record<string, VoiceConfig>;

// Utility type for form state
export interface VoiceFormState extends Omit<SpeakerConfig, 'name'> {
  selectedVoice: VoiceName;
} 