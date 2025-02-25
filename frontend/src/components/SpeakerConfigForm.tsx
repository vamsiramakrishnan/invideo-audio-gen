import React, { useState, useEffect } from 'react';
import { SpeakerVoiceMapping } from '../types/speaker';
import { useVoice } from '../contexts/VoiceContext';
import { useSpeakerConfig } from '../hooks/useSpeakerConfig';
import { useVoiceSelection } from '../hooks/useVoiceSelection';
import { VoiceName, VoiceStyle, VOICE_STYLE_PRESETS } from '../types/voice';
import { Gender, AccentType, VoiceTone, SpeakerConfig } from '../types/base';
import VoiceCard from './VoiceCard';
import { CustomSelect } from './CustomSelect';

interface SpeakerConfigFormProps {
  characters: string[];
  onSubmit: (voiceConfigs: Record<string, SpeakerVoiceMapping>) => Promise<void>;
  isLoading?: boolean;
}

interface SpeakerState {
  config: Omit<SpeakerConfig, 'name'>;
  style: VoiceStyle | 'custom';
  isValid: boolean;
}

const SpeakerConfigForm: React.FC<SpeakerConfigFormProps> = ({
  characters,
  onSubmit,
  isLoading = false,
}) => {
  const { voiceOptions, voiceMetadata, isLoading: isLoadingVoices } = useVoice();
  const { selectedVoice, selectVoice } = useVoiceSelection();
  const speakerConfig = useSpeakerConfig('template'); // Use a template config for initial values
  
  // Track speaker configurations and styles
  const [speakerStates, setSpeakerStates] = useState<Record<string, SpeakerState>>({});

  // Initialize configs for each speaker
  useEffect(() => {
    if (!speakerConfig.config) return;

    const states: Record<string, SpeakerState> = {};
    characters.forEach(character => {
      states[character] = {
        config: { ...speakerConfig.config },
        style: 'neutral_professional',
        isValid: speakerConfig.isValid
      };
    });
    setSpeakerStates(states);
  }, [characters, speakerConfig.config]);

  if (!voiceOptions || !voiceMetadata || isLoadingVoices || Object.keys(speakerStates).length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoice) return;

    const voiceConfigs: Record<string, SpeakerVoiceMapping> = {};
    characters.forEach(character => {
      const state = speakerStates[character];
      if (state && state.isValid) {
        voiceConfigs[character] = {
          voice: selectedVoice,
          config: {
            name: character,
            ...state.config
          }
        };
      }
    });

    if (Object.keys(voiceConfigs).length === characters.length) {
      await onSubmit(voiceConfigs);
    }
  };

  const handleStyleChange = (character: string, style: VoiceStyle | 'custom') => {
    setSpeakerStates(prev => {
      const updated = { ...prev };
      if (updated[character]) {
        updated[character].style = style;
        if (style !== 'custom') {
          const preset = VOICE_STYLE_PRESETS[style];
          updated[character].config = {
            ...updated[character].config,
            ...preset,
            // Preserve fields that shouldn't be overwritten by style
            age: updated[character].config.age,
            gender: updated[character].config.gender,
            persona: updated[character].config.persona,
            background: updated[character].config.background,
            accent: updated[character].config.accent
          };
        }
      }
      return updated;
    });
  };

  const handleConfigUpdate = (character: string, updates: Partial<Omit<SpeakerConfig, 'name'>>) => {
    setSpeakerStates(prev => {
      const updated = { ...prev };
      if (updated[character]) {
        updated[character].config = {
          ...updated[character].config,
          ...updates
        };
        // Validate the updated config
        const { age_range, genders, accents, voice_tones } = voiceOptions;
        const config = updated[character].config;
        
        const isBasicValid = 
          config.age >= age_range[0] && 
          config.age <= age_range[1] &&
          genders.includes(config.gender) &&
          accents.includes(config.accent) &&
          voice_tones.includes(config.voice_tone);

        const isCharacteristicsValid = Object.entries(config.voice_characteristics).every(
          ([key, value]) => voiceOptions.voice_characteristics_options[key as keyof typeof config.voice_characteristics]?.includes(value)
        );

        const isPatternsValid = Object.entries(config.speech_patterns).every(
          ([key, value]) => voiceOptions.speech_patterns_options[key as keyof typeof config.speech_patterns]?.includes(value)
        );

        const isRatesValid = 
          config.speaking_rate.normal >= voiceOptions.speaking_rate_ranges.normal[0] &&
          config.speaking_rate.normal <= voiceOptions.speaking_rate_ranges.normal[1] &&
          config.speaking_rate.excited >= voiceOptions.speaking_rate_ranges.excited[0] &&
          config.speaking_rate.excited <= voiceOptions.speaking_rate_ranges.excited[1] &&
          config.speaking_rate.analytical >= voiceOptions.speaking_rate_ranges.analytical[0] &&
          config.speaking_rate.analytical <= voiceOptions.speaking_rate_ranges.analytical[1];

        updated[character].isValid = isBasicValid && isCharacteristicsValid && isPatternsValid && isRatesValid;
      }
      return updated;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Voice Selection */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-base font-medium">Select Voice</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(voiceMetadata).map(([name, metadata]) => (
            <VoiceCard
              key={name}
              name={name as VoiceName}
              metadata={metadata}
              isSelected={selectedVoice === name}
              onSelect={() => selectVoice(name as VoiceName)}
              isCompact={true}
            />
          ))}
        </div>
      </div>

      {selectedVoice && (
        <div className="space-y-8">
          {characters.map(character => {
            const state = speakerStates[character];
            if (!state) return null;

            const { config, style, isValid } = state;

            return (
              <div key={character} className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title text-lg flex items-center gap-2">
                    <span className="badge badge-primary">{character}</span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal">Style:</span>
                      <select
                        className="select select-sm select-bordered"
                        value={style}
                        onChange={(e) => handleStyleChange(character, e.target.value as VoiceStyle | 'custom')}
                      >
                        {Object.keys(VOICE_STYLE_PRESETS).map(presetStyle => (
                          <option key={presetStyle} value={presetStyle}>
                            {presetStyle.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </option>
                        ))}
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </h3>

                  {/* Basic Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomSelect
                      label="Age"
                      value={config.age}
                      onChange={(value: string) => handleConfigUpdate(character, { age: Number(value) })}
                      options={Array.from(
                        { length: voiceOptions.age_range[1] - voiceOptions.age_range[0] + 1 },
                        (_, i) => ({
                          value: voiceOptions.age_range[0] + i,
                          label: `${voiceOptions.age_range[0] + i} years`
                        })
                      )}
                    />

                    <CustomSelect
                      label="Gender"
                      value={config.gender}
                      onChange={(value: string) => handleConfigUpdate(character, { gender: value as Gender })}
                      options={voiceOptions.genders.map(gender => ({
                        value: gender,
                        label: gender.charAt(0).toUpperCase() + gender.slice(1)
                      }))}
                    />

                    <CustomSelect
                      label="Voice Tone"
                      value={config.voice_tone}
                      onChange={(value: string) => handleConfigUpdate(character, { voice_tone: value as VoiceTone })}
                      options={voiceOptions.voice_tones.map(tone => ({
                        value: tone,
                        label: tone.charAt(0).toUpperCase() + tone.slice(1)
                      }))}
                    />

                    <CustomSelect
                      label="Accent"
                      value={config.accent}
                      onChange={(value: string) => handleConfigUpdate(character, { accent: value as AccentType })}
                      options={voiceOptions.accents.map(accent => ({
                        value: accent,
                        label: accent.charAt(0).toUpperCase() + accent.slice(1)
                      }))}
                    />
                  </div>

                  {/* Collapsible Advanced Settings */}
                  {style === 'custom' && (
                    <div className="collapse collapse-arrow bg-base-100">
                      <input type="checkbox" className="peer" /> 
                      <div className="collapse-title text-base font-medium">
                        Advanced Voice Settings
                      </div>
                      <div className="collapse-content">
                        {/* Voice Characteristics */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Voice Characteristics</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(voiceOptions.voice_characteristics_options).map(([key, values]) => (
                              <CustomSelect
                                key={key}
                                label={key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                value={config.voice_characteristics[key as keyof typeof config.voice_characteristics]}
                                onChange={(value: string) => handleConfigUpdate(character, {
                                  voice_characteristics: {
                                    ...config.voice_characteristics,
                                    [key]: value
                                  }
                                })}
                                options={values.map(value => ({
                                  value,
                                  label: value.charAt(0).toUpperCase() + value.slice(1)
                                }))}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Speech Patterns */}
                        <div className="space-y-4 mt-6">
                          <h4 className="font-medium">Speech Patterns</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(voiceOptions.speech_patterns_options).map(([key, values]) => (
                              <CustomSelect
                                key={key}
                                label={key.charAt(0).toUpperCase() + key.slice(1)}
                                value={config.speech_patterns[key as keyof typeof config.speech_patterns]}
                                onChange={(value: string) => handleConfigUpdate(character, {
                                  speech_patterns: {
                                    ...config.speech_patterns,
                                    [key]: value
                                  }
                                })}
                                options={values.map(value => ({
                                  value,
                                  label: value.charAt(0).toUpperCase() + value.slice(1)
                                }))}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Speaking Rate */}
                        <div className="space-y-4 mt-6">
                          <h4 className="font-medium">Speaking Rate</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(voiceOptions.speaking_rate_ranges).map(([key, [min, max]]) => (
                              <CustomSelect
                                key={key}
                                label={`${key.charAt(0).toUpperCase() + key.slice(1)} Rate`}
                                value={config.speaking_rate[key as keyof typeof config.speaking_rate]}
                                onChange={(value: string) => handleConfigUpdate(character, {
                                  speaking_rate: {
                                    ...config.speaking_rate,
                                    [key]: Number(value)
                                  }
                                })}
                                options={Array.from(
                                  { length: Math.floor((max - min) / 10) + 1 },
                                  (_, i) => ({
                                    value: min + i * 10,
                                    label: `${min + i * 10} wpm`
                                  })
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Validation Status */}
                  {!isValid && (
                    <div className="mt-4 text-sm text-error">
                      Please ensure all fields are properly configured
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`
                btn btn-primary gap-2
                ${isLoading ? 'loading' : ''}
              `}
              disabled={!Object.values(speakerStates).every(state => state.isValid) || isLoading}
            >
              {!isLoading && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Generate Audio
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default SpeakerConfigForm;