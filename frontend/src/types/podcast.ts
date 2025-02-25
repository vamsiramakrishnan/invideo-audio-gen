// Base types for podcast configuration
export type ExpertiseLevel = 'beginner' | 'intermediate' | 'expert' | 'mixed';
export type FormatStyle = 'casual' | 'interview' | 'debate' | 'educational' | 'storytelling';

// Configuration type that defines available options
export interface PodcastConfig {
  duration_options: number[];
  speaker_options: number[];
  expertise_levels: ExpertiseLevel[];
  format_styles: FormatStyle[];
}

// Type helpers to ensure concept values match config options
export type ValidConfigValue<T extends any[]> = T[number];

// Podcast concept type that uses configuration constraints
export interface PodcastConcept {
  topic: string;
  num_speakers: number;  // Constrained by PodcastConfig['speaker_options']
  character_names: string[];
  expertise_level: ExpertiseLevel;  // Constrained by available ExpertiseLevel values
  duration_minutes: number;  // Constrained by PodcastConfig['duration_options']
  format_style: FormatStyle;  // Constrained by available FormatStyle values
}

// Type guard to ensure concept values match config
export function isValidConceptForConfig(
  concept: PodcastConcept,
  config: PodcastConfig
): concept is PodcastConcept {
  return (
    config.speaker_options.includes(concept.num_speakers) &&
    config.duration_options.includes(concept.duration_minutes) &&
    config.expertise_levels.includes(concept.expertise_level) &&
    config.format_styles.includes(concept.format_style) &&
    concept.character_names.length === concept.num_speakers
  );
} 