import axios from 'axios';
import { PodcastConcept, PodcastConfig } from '../types/podcast';
import { VoiceConfigurationOptions, VoiceMetadata } from '../types/voice';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateTranscript = async (concept: PodcastConcept) => {
  const response = await api.post<string>('/transcript/generate', concept);
  return response.data;
};

export const getPodcastConfig = async (): Promise<PodcastConfig> => {
  const response = await api.get<PodcastConfig>('/config');
  return response.data;
};

// Voice configuration endpoints
export const getVoiceConfig = async (): Promise<VoiceConfigurationOptions> => {
  const response = await api.get<VoiceConfigurationOptions>('/config/voice');
  return response.data;
};

export const getVoiceMetadata = async (): Promise<Record<string, VoiceMetadata>> => {
  const response = await api.get<Record<string, VoiceMetadata>>('/config/voice/metadata');
  return response.data;
}; 