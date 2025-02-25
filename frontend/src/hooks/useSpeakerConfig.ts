import { useState, useEffect } from 'react';
import { useVoice } from '../contexts/VoiceContext';
import { 
  SpeakerConfig, 
  Gender, 
  VoiceTone, 
  AccentType,
  VoiceCharacteristics,
  SpeechPatterns 
} from '../types/base';
import { VOICE_STYLE_PRESETS, VoiceStyle } from '../types/voice';

interface UseSpeakerConfigReturn {
  config: Omit<SpeakerConfig, 'name'>;
  updateConfig: (updates: Partial<Omit<SpeakerConfig, 'name'>>) => void;
  isValid: boolean;
  applyVoiceStyle: (style: VoiceStyle) => void;
}

export const useSpeakerConfig = (character: string): UseSpeakerConfigReturn => {
  const { voiceOptions } = useVoice();
  const [config, setConfig] = useState<Omit<SpeakerConfig, 'name'>>({
    age: 30,
    gender: 'neutral' as Gender,
    persona: 'Podcast Host',
    background: 'Experienced in the topic',
    voice_tone: 'professional' as VoiceTone,
    accent: 'neutral' as AccentType,
    speaking_rate: {
      normal: 150,
      excited: 170,
      analytical: 130
    },
    voice_characteristics: {
      pitch_range: 'medium',
      resonance: 'balanced',
      breathiness: 'low',
      vocal_energy: 'medium',
      pause_pattern: 'natural',
      emphasis_pattern: 'standard',
      emotional_range: 'balanced',
      breathing_pattern: 'relaxed'
    },
    speech_patterns: {
      phrasing: 'natural',
      rhythm: 'regular',
      articulation: 'clear',
      modulation: 'moderate'
    }
  });

  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!voiceOptions) return;

    const validateConfig = () => {
      const { age_range, genders, accents, voice_tones } = voiceOptions;
      
      // Validate basic fields
      const isBasicValid = 
        config.age >= age_range[0] && 
        config.age <= age_range[1] &&
        genders.includes(config.gender) &&
        accents.includes(config.accent) &&
        voice_tones.includes(config.voice_tone);

      // Validate voice characteristics
      const isCharacteristicsValid = Object.entries(config.voice_characteristics).every(
        ([key, value]) => {
          const k = key as keyof VoiceCharacteristics;
          return voiceOptions.voice_characteristics_options[k]?.includes(value);
        }
      );

      // Validate speech patterns
      const isPatternsValid = Object.entries(config.speech_patterns).every(
        ([key, value]) => {
          const k = key as keyof SpeechPatterns;
          return voiceOptions.speech_patterns_options[k]?.includes(value);
        }
      );

      // Validate speaking rates
      const isRatesValid = 
        config.speaking_rate.normal >= voiceOptions.speaking_rate_ranges.normal[0] &&
        config.speaking_rate.normal <= voiceOptions.speaking_rate_ranges.normal[1] &&
        config.speaking_rate.excited >= voiceOptions.speaking_rate_ranges.excited[0] &&
        config.speaking_rate.excited <= voiceOptions.speaking_rate_ranges.excited[1] &&
        config.speaking_rate.analytical >= voiceOptions.speaking_rate_ranges.analytical[0] &&
        config.speaking_rate.analytical <= voiceOptions.speaking_rate_ranges.analytical[1];

      setIsValid(isBasicValid && isCharacteristicsValid && isPatternsValid && isRatesValid);
    };

    validateConfig();
  }, [config, voiceOptions]);

  const updateConfig = (updates: Partial<Omit<SpeakerConfig, 'name'>>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const applyVoiceStyle = (style: VoiceStyle) => {
    const preset = VOICE_STYLE_PRESETS[style];
    if (preset) {
      setConfig(prev => ({
        ...prev,
        ...preset,
        // Preserve fields that shouldn't be overwritten by style
        age: prev.age,
        gender: prev.gender,
        persona: prev.persona,
        background: prev.background,
        accent: prev.accent
      }));
    }
  };

  return {
    config,
    updateConfig,
    isValid,
    applyVoiceStyle
  };
};