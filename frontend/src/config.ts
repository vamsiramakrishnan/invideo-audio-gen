// Configuration constants for the application

// API Base URL
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Default values
export const DEFAULT_PODCAST_DURATION = 10; // in minutes
export const DEFAULT_NUM_SPEAKERS = 2;

// Features flags
export const FEATURES = {
  ENABLE_VOICE_SELECTION: true,
  ENABLE_TRANSCRIPT_EDITING: true,
  ENABLE_CUSTOM_VOICES: true,
}; 