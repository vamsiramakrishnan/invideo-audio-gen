import { VoiceName } from './voice';
import { SpeakerConfig } from './base';
import { VoiceConfig } from './voice';

// Speaker-specific types
export type SpeakerVoiceMapping = VoiceConfig;

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