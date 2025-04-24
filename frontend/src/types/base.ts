// Common enums and primitive types
export type Gender = 'male' | 'female' | 'neutral';
export type AccentType = 'neutral' | 'british' | 'american' | 'australian' | 'indian';
export type VoiceTone = 'warm' | 'professional' | 'energetic' | 'calm' | 'authoritative';

// Base interfaces for voice configuration
export interface SpeakingRate {
  normal: number;
  excited: number;
  analytical: number;
}

export interface VoiceCharacteristics {
  pitch_range: string;
  resonance: string;
  breathiness: string;
  vocal_energy: string;
  pause_pattern: string;
  emphasis_pattern: string;
  emotional_range: string;
  breathing_pattern: string;
}

export interface SpeechPatterns {
  phrasing: string;
  rhythm: string;
  articulation: string;
  modulation: string;
}

// Base configuration interface
export interface SpeakerConfig {
  name: string;
  age: number;
  gender: Gender;
  persona: string;
  background: string;
  voice_tone: VoiceTone;
  accent: AccentType;
  speaking_rate: SpeakingRate;
  voice_characteristics: VoiceCharacteristics;
  speech_patterns: SpeechPatterns;
  custom_persona?: string;
  custom_background?: string;
  voice?: string;
} 