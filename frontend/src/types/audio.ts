import { VoiceConfig } from './voice';

export interface AudioSegment {
  speaker: string;
  path: string;
  duration: number;
}

export interface ProgressUpdate {
  type: 'progress' | 'segment_complete' | 'error' | 'complete';
  stage: string;
  message?: string;
  speaker?: string;
  segment_path?: string;
  duration?: number;
  error?: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  segments?: AudioSegment[];
}

export interface GenerationRequest {
  transcript: string;
  voiceMappings: Record<string, VoiceConfig>;
}
