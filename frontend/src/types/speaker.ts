import { VoiceName } from './voice';
import { SpeakerConfig } from './base';
import { VoiceConfig } from './voice';

/**
 * Represents a mapping between a speaker and their voice configuration
 */
export interface SpeakerVoiceMapping {
  voice: VoiceName | '';
  config: SpeakerConfig | null;
}

// Form-specific types
export interface SpeakerFormState {
    selectedVoice: VoiceName | null;
    config: Omit<SpeakerConfig, 'name'>;
}

// API request types
export interface SpeakerRequest {
    transcript: string;
    voiceMappings: Record<string, VoiceConfig>;
} 