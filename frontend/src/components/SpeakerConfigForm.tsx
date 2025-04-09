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
  validationErrors: Record<string, string>;
}

const SpeakerConfigForm: React.FC<SpeakerConfigFormProps> = ({
  characters,
  onSubmit,
  isLoading = false,
}) => {
  console.log('SpeakerConfigForm received characters:', characters);

  const { voiceOptions, voiceMetadata, isLoading: isLoadingVoices, error: voiceLoadingError } = useVoice();
  const { selectedVoice, selectVoice } = useVoiceSelection();
  const speakerConfig = useSpeakerConfig('template'); // Use a template config for initial values
  
  // Track speaker configurations and styles
  const [speakerStates, setSpeakerStates] = useState<Record<string, SpeakerState>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Define validateSpeakerConfig function before it's used in useEffect
  const validateSpeakerConfig = (states: Record<string, SpeakerState>, character: string) => {
    if (!voiceOptions) return;
    
    const { age_range, genders, accents, voice_tones } = voiceOptions;
    const config = states[character].config;
    const errors: Record<string, string> = {};
    
    // Basic validation - only validate if values are provided
    if (config.age !== undefined && (config.age < age_range[0] || config.age > age_range[1])) {
      errors.age = `Age must be between ${age_range[0]} and ${age_range[1]}`;
    }
    
    if (config.gender && !genders.includes(config.gender)) {
      errors.gender = 'Invalid gender selection';
    }
    
    if (config.accent && !accents.includes(config.accent)) {
      errors.accent = 'Invalid accent selection';
    }
    
    if (config.voice_tone && !voice_tones.includes(config.voice_tone)) {
      errors.voice_tone = 'Invalid voice tone selection';
    }
    
    // Voice characteristics validation - only validate if values are provided
    // The backend accepts string values for these fields, so we'll be more lenient
    if (config.voice_characteristics) {
      Object.entries(config.voice_characteristics).forEach(([key, value]) => {
        // Only validate if the value is provided and options exist
        const options = voiceOptions.voice_characteristics_options[key as keyof typeof config.voice_characteristics];
        if (value && options && Array.isArray(options) && options.length > 0) {
          // For string values, we'll check if they contain any of the valid options
          // This is more lenient than exact matching
          const containsValidOption = options.some(option => 
            value.toLowerCase().includes(option.toLowerCase())
          );
          
          if (!containsValidOption) {
            const validOptions = options.join(', ') || '';
            errors[`voice_characteristics.${key}`] = `Voice ${key.replace('_', ' ')} should include one of: ${validOptions}`;
          }
        }
      });
    }
    
    // Speech patterns validation - only validate if values are provided
    // The backend accepts string values for these fields, so we'll be more lenient
    if (config.speech_patterns) {
      Object.entries(config.speech_patterns).forEach(([key, value]) => {
        // Only validate if the value is provided and options exist
        const options = voiceOptions.speech_patterns_options[key as keyof typeof config.speech_patterns];
        if (value && options && Array.isArray(options) && options.length > 0) {
          // For string values, we'll check if they contain any of the valid options
          // This is more lenient than exact matching
          const containsValidOption = options.some(option => 
            value.toLowerCase().includes(option.toLowerCase())
          );
          
          if (!containsValidOption) {
            const validOptions = options.join(', ') || '';
            errors[`speech_patterns.${key}`] = `Speech ${key.replace('_', ' ')} should include one of: ${validOptions}`;
          }
        }
      });
    }
    
    // Speaking rate validation - only validate if values are provided
    if (config.speaking_rate) {
      const { normal, excited, analytical } = config.speaking_rate;
      const normalRange = voiceOptions.speaking_rate_ranges.normal;
      const excitedRange = voiceOptions.speaking_rate_ranges.excited;
      const analyticalRange = voiceOptions.speaking_rate_ranges.analytical;
      
      // Convert to numbers for comparison if they're strings
      const normalNum = typeof normal === 'string' ? parseFloat(normal) : normal;
      const excitedNum = typeof excited === 'string' ? parseFloat(excited) : excited;
      const analyticalNum = typeof analytical === 'string' ? parseFloat(analytical) : analytical;
      
      if (normalNum !== undefined && !isNaN(normalNum) && (normalNum < normalRange[0] || normalNum > normalRange[1])) {
        errors['speaking_rate.normal'] = `Normal rate must be between ${normalRange[0]} and ${normalRange[1]}`;
      }
      
      if (excitedNum !== undefined && !isNaN(excitedNum) && (excitedNum < excitedRange[0] || excitedNum > excitedRange[1])) {
        errors['speaking_rate.excited'] = `Excited rate must be between ${excitedRange[0]} and ${excitedRange[1]}`;
      }
      
      if (analyticalNum !== undefined && !isNaN(analyticalNum) && (analyticalNum < analyticalRange[0] || analyticalNum > analyticalRange[1])) {
        errors['speaking_rate.analytical'] = `Analytical rate must be between ${analyticalRange[0]} and ${analyticalRange[1]}`;
      }
    }
    
    // Update validation state
    states[character].validationErrors = errors;
    states[character].isValid = Object.keys(errors).length === 0;
  };

  // Initialize configs for each speaker
  useEffect(() => {
    if (!speakerConfig.config || !voiceOptions) return;

    const states: Record<string, SpeakerState> = {};
    characters.forEach(character => {
      // Use a preset style for initial configuration
      const presetStyle = 'neutral_professional';
      const presetConfig = VOICE_STYLE_PRESETS[presetStyle];
      
      // Combine the template config with the preset
      const initialConfig = {
        ...speakerConfig.config,
        ...presetConfig,
        // Set some reasonable defaults for required fields
        age: 35,
        gender: 'neutral' as Gender,
        persona: `${character} - Podcast Speaker`,
        background: `${character} is an experienced speaker with knowledge in the topic.`,
        accent: 'neutral' as AccentType,
        voice_tone: 'professional' as VoiceTone
      };
      
      states[character] = {
        config: initialConfig,
        style: presetStyle,
        isValid: true, // Assume valid initially
        validationErrors: {}
      };
      
      // Validate after initialization
      if (voiceOptions) {
        validateSpeakerConfig(states, character);
      }
    });
    setSpeakerStates(states);
  }, [characters, speakerConfig.config, voiceOptions]);

  // Apply a style preset to all speakers
  const applyStyleToAll = (style: VoiceStyle | 'custom') => {
    setSpeakerStates(prev => {
      const updated = { ...prev };
      
      Object.keys(updated).forEach(character => {
        if (style !== 'custom') {
          const preset = VOICE_STYLE_PRESETS[style];
          updated[character] = {
            ...updated[character],
            style,
            config: {
              ...updated[character].config,
              ...preset,
              // Preserve fields that shouldn't be overwritten by style
              age: updated[character].config.age,
              gender: updated[character].config.gender,
              persona: updated[character].config.persona,
              background: updated[character].config.background,
              accent: updated[character].config.accent
            }
          };
        } else {
          updated[character].style = 'custom';
        }
        
        // Validate the updated config
        validateSpeakerConfig(updated, character);
      });
      
      return updated;
    });
  };

  if (isLoadingVoices || (!voiceOptions && !voiceLoadingError) || (!voiceMetadata && !voiceLoadingError)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-12 bg-gradient-to-br from-base-200/50 to-base-300/30 rounded-2xl">
        <div className="flex flex-col items-center gap-6">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-lg font-medium text-base-content/70 animate-pulse">Loading voice options...</p>
          <div className="badge badge-ghost badge-sm animate-pulse">Initializing components...</div>
        </div>
      </div>
    );
  }

  if (voiceLoadingError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-12 bg-gradient-to-br from-error/10 to-error/5 rounded-2xl border border-error/30">
        <div className="flex flex-col items-center gap-4 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-error shrink-0 h-16 w-16" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-error">Failed to Load Voice Options</h2>
          <p className="text-base-content/80">{voiceLoadingError}</p>
          <p className="text-sm text-base-content/60">Please check the backend API connection and try refreshing the page.</p>
        </div>
      </div>
    );
  }

  if (!voiceOptions || !voiceMetadata) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-lg text-error">Unexpected state: Voice data is missing after loading.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Check if all speakers have the required fields
    const incompleteConfigs = characters.filter(character => {
      const config = speakerStates[character]?.config;
      return !config || !config.persona || !config.background;
    });
    
    if (incompleteConfigs.length > 0) {
      setFormError(`Please complete the basic configuration for: ${incompleteConfigs.join(', ')}`);
      return;
    }

    // Check for validation warnings but don't block submission
    const speakersWithWarnings = Object.entries(speakerStates)
      .filter(([_, state]) => !state.isValid)
      .map(([name]) => name);
      
    if (speakersWithWarnings.length > 0) {
      console.warn(`Proceeding with warnings for speakers: ${speakersWithWarnings.join(', ')}`);
    }

    // Prepare voice configurations for all speakers
    const voiceConfigs: Record<string, SpeakerVoiceMapping> = {};
    characters.forEach(character => {
      const state = speakerStates[character];
      voiceConfigs[character] = {
        voice: "Puck", // Use a default voice name since we're using Gemini
        config: {
          name: character,
          ...state.config
        }
      };
    });

    try {
      await onSubmit(voiceConfigs);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to generate voices. Please try again.');
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
        
        // Validate the updated config
        validateSpeakerConfig(updated, character);
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
        
        // When manually updating config, switch to custom style
        updated[character].style = 'custom';
        
        // Validate the updated config
        validateSpeakerConfig(updated, character);
      }
      return updated;
    });
  };

  return (
    <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-primary/10 rounded-2xl backdrop-blur-sm">
      <div className="card-body p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="card-title text-2xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            <span className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </span>
            Voice Configuration
          </h2>
          <div className="badge badge-primary badge-outline p-3 font-medium text-sm">
            Characters: {characters.length}
          </div>
        </div>

        {formError && (
          <div className="alert alert-error mb-8 shadow-lg border border-error/20 animate__animated animate__headShake">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <h3 className="font-bold">Error</h3>
              <div className="text-sm">{formError}</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => setFormError(null)}>Dismiss</button>
          </div>
        )}

        <div className="mb-10 space-y-6">
          <div className="bg-gradient-to-br from-base-200 to-base-300 p-6 rounded-2xl mb-8 shadow-inner border border-base-content/5">
            <h3 className="text-xl font-bold mb-5 text-base-content flex items-center gap-2">
              <span className="text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              Select Voice Model
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.isArray(voiceOptions) && voiceOptions.map((voice: VoiceName) => (
                <VoiceCard
                  key={voice}
                  name={voice}
                  metadata={voiceMetadata[voice]}
                  isSelected={selectedVoice === voice}
                  onSelect={() => selectVoice(voice)}
                  isCompact={true}
                />
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-base-200 to-base-300 p-6 rounded-2xl shadow-inner border border-base-content/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
                <span className="text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </span>
                Voice Style Presets
              </h3>
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-sm btn-primary btn-outline hover:btn-secondary transition-all duration-300 shadow-md">
                  Apply to All Speakers
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </label>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-xl w-60 mt-1 border border-primary/10">
                  <li className="menu-title"><span>Style Presets</span></li>
                  {Object.keys(VOICE_STYLE_PRESETS).map((style) => (
                    <li key={style}>
                      <a onClick={() => applyStyleToAll(style as VoiceStyle)} className="hover:bg-primary/10 font-medium">
                        {style.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </a>
                    </li>
                  ))}
                  <li className="divider"></li>
                  <li>
                    <a onClick={() => applyStyleToAll('custom')} className="text-secondary font-semibold">Custom Settings</a>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-100 w-full">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="stat-title text-base-content/70 font-medium">Characters</div>
                <div className="stat-value text-primary">{characters.length}</div>
                <div className="stat-desc">Voice configurations to set</div>
              </div>
              
              <div className="stat">
                <div className="stat-figure text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="stat-title text-base-content/70 font-medium">Presets</div>
                <div className="stat-value text-secondary">{Object.keys(VOICE_STYLE_PRESETS).length}</div>
                <div className="stat-desc">Available style presets</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="divider before:bg-gradient-to-r before:from-primary/0 before:to-primary/20 after:bg-gradient-to-r after:from-primary/20 after:to-primary/0">
            <span className="px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg text-base-content font-bold">
              Character Voice Settings
            </span>
          </div>
          
          <div className="space-y-8">
            {characters.map((character) => {
              const speakerState = speakerStates[character];
              if (!speakerState) return null;
              
              return (
                <div key={character} className="card bg-gradient-to-br from-base-200/80 to-base-300/80 hover:from-base-200 hover:to-base-300 shadow-md hover:shadow-lg transition-all duration-300 border border-primary/5 overflow-hidden">
                  <div className="card-body p-6">
                    <h3 className="card-title text-lg flex items-center gap-3 mb-2">
                      <div className="avatar placeholder">
                        <div className="bg-gradient-to-br from-primary to-secondary text-primary-content rounded-full w-10 h-10 shadow-md flex items-center justify-center">
                          <span className="text-lg font-bold">{character.charAt(0)}</span>
                        </div>
                      </div>
                      <span className="font-extrabold tracking-tight">{character}</span>
                      {speakerState.isValid ? (
                        <div className="badge badge-success badge-sm ml-auto">Valid</div>
                      ) : (
                        <div className="badge badge-warning badge-sm ml-auto">Warnings</div>
                      )}
                    </h3>
                    
                    <div className="divider my-3 h-px bg-gradient-to-r from-transparent via-base-content/10 to-transparent"></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-base-100/50 p-4 rounded-xl shadow-inner">
                          <CustomSelect
                            label="Voice Style"
                            value={speakerState.style}
                            onChange={(value) => handleStyleChange(character, value as VoiceStyle | 'custom')}
                            options={[
                              ...Object.keys(VOICE_STYLE_PRESETS).map(style => ({
                                value: style,
                                label: style.split('_').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')
                              })),
                              { value: 'custom', label: 'Custom Settings' }
                            ]}
                          />
                        </div>
                        
                        {speakerState.style === 'custom' && (
                          <div className="bg-base-100/50 p-4 rounded-xl shadow-inner space-y-5">
                            <div className="form-control">
                              <label className="label">
                                <span className="label-text font-medium text-base-content/90">Gender</span>
                              </label>
                              <select
                                className="select select-bordered w-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                                value={speakerState.config.gender}
                                onChange={(e) => handleConfigUpdate(character, { gender: e.target.value as Gender })}
                              >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="neutral">Neutral</option>
                              </select>
                            </div>
                            
                            <div className="form-control">
                              <label className="label">
                                <span className="label-text font-medium text-base-content/90">Age</span>
                                <span className="label-text-alt bg-base-200 px-2 py-1 rounded-md text-base-content/70 font-medium">{speakerState.config.age} years</span>
                              </label>
                              <input
                                type="range"
                                min="18"
                                max="100"
                                value={speakerState.config.age}
                                onChange={(e) => handleConfigUpdate(character, { age: parseInt(e.target.value) })}
                                className="range range-primary range-sm"
                              />
                              <div className="w-full flex justify-between text-xs px-2 mt-1 text-base-content/60 font-medium">
                                <span>18</span>
                                <span>40</span>
                                <span>60</span>
                                <span>80</span>
                                <span>100</span>
                              </div>
                            </div>
                            
                            <div className="form-control">
                              <label className="label">
                                <span className="label-text font-medium text-base-content/90">Accent</span>
                              </label>
                              <select
                                className="select select-bordered w-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                                value={speakerState.config.accent}
                                onChange={(e) => handleConfigUpdate(character, { accent: e.target.value as AccentType })}
                              >
                                <option value="neutral">Neutral</option>
                                <option value="american">American</option>
                                <option value="british">British</option>
                                <option value="australian">Australian</option>
                                <option value="indian">Indian</option>
                                <option value="spanish">Spanish</option>
                                <option value="french">French</option>
                                <option value="german">German</option>
                                <option value="italian">Italian</option>
                                <option value="japanese">Japanese</option>
                                <option value="chinese">Chinese</option>
                                <option value="korean">Korean</option>
                                <option value="russian">Russian</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {speakerState.style === 'custom' && (
                        <div className="bg-base-100/50 p-4 rounded-xl shadow-inner space-y-5">
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium text-base-content/90">Voice Tone</span>
                              <span className="label-text-alt bg-base-200 px-2 py-1 rounded-md text-base-content/70 font-medium">{speakerState.config.voice_tone}</span>
                            </label>
                            <select
                              className="select select-bordered w-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                              value={speakerState.config.voice_tone}
                              onChange={(e) => handleConfigUpdate(character, { voice_tone: e.target.value as VoiceTone })}
                            >
                              <option value="neutral">Neutral</option>
                              <option value="friendly">Friendly</option>
                              <option value="professional">Professional</option>
                              <option value="formal">Formal</option>
                              <option value="casual">Casual</option>
                              <option value="excited">Excited</option>
                              <option value="sad">Sad</option>
                              <option value="angry">Angry</option>
                              <option value="fearful">Fearful</option>
                              <option value="disgusted">Disgusted</option>
                              <option value="surprised">Surprised</option>
                            </select>
                          </div>
                          
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text flex items-center gap-1 font-medium text-base-content/90">
                                Normal Speaking Rate
                                <div className="tooltip tooltip-right" data-tip="The base speaking rate for normal, neutral conversation">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </span>
                              <span className="label-text-alt bg-base-200 px-2 py-1 rounded-md text-base-content/70 font-medium">{speakerState.config.speaking_rate?.normal?.toFixed(1) || "1.0"}</span>
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.1"
                              value={speakerState.config.speaking_rate?.normal || 1.0}
                              onChange={(e) => handleConfigUpdate(character, { 
                                speaking_rate: {
                                  ...speakerState.config.speaking_rate,
                                  normal: parseFloat(e.target.value)
                                }
                              })}
                              className="range range-primary range-sm"
                            />
                            <div className="w-full flex justify-between text-xs px-2 mt-1 text-base-content/60 font-medium">
                              <span>Slow</span>
                              <span>Normal</span>
                              <span>Fast</span>
                            </div>
                          </div>
                          
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text flex items-center gap-1 font-medium text-base-content/90">
                                Excited Speaking Rate
                                <div className="tooltip tooltip-right" data-tip="How quickly the voice speaks during emotional or excited moments">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </span>
                              <span className="label-text-alt bg-base-200 px-2 py-1 rounded-md text-base-content/70 font-medium">{speakerState.config.speaking_rate?.excited?.toFixed(1) || "1.0"}</span>
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.1"
                              value={speakerState.config.speaking_rate?.excited || 1.0}
                              onChange={(e) => handleConfigUpdate(character, { 
                                speaking_rate: {
                                  ...speakerState.config.speaking_rate,
                                  excited: parseFloat(e.target.value)
                                }
                              })}
                              className="range range-secondary range-sm"
                            />
                            <div className="w-full flex justify-between text-xs px-2 mt-1 text-base-content/60 font-medium">
                              <span>Slower</span>
                              <span>Default</span>
                              <span>Faster</span>
                            </div>
                          </div>
                          
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text flex items-center gap-1 font-medium text-base-content/90">
                                Analytical Speaking Rate
                                <div className="tooltip tooltip-right" data-tip="How the voice paces itself during technical, detailed, or analytical explanations">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </span>
                              <span className="label-text-alt bg-base-200 px-2 py-1 rounded-md text-base-content/70 font-medium">{speakerState.config.speaking_rate?.analytical?.toFixed(1) || "1.0"}</span>
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.1"
                              value={speakerState.config.speaking_rate?.analytical || 1.0}
                              onChange={(e) => handleConfigUpdate(character, { 
                                speaking_rate: {
                                  ...speakerState.config.speaking_rate,
                                  analytical: parseFloat(e.target.value)
                                }
                              })}
                              className="range range-accent range-sm"
                            />
                            <div className="w-full flex justify-between text-xs px-2 mt-1 text-base-content/60 font-medium">
                              <span>Slower</span>
                              <span>Default</span>
                              <span>Faster</span>
                            </div>
                          </div>
                          
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium text-base-content/90">Persona Description</span>
                            </label>
                            <textarea
                              className="textarea textarea-bordered h-24 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                              placeholder="Describe the character's persona..."
                              value={speakerState.config.persona}
                              onChange={(e) => handleConfigUpdate(character, { persona: e.target.value })}
                            />
                            <label className="label">
                              <span className="label-text-alt text-base-content/60">Add details about the character's background, personality, and speaking style</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {speakerState.validationErrors && Object.keys(speakerState.validationErrors).length > 0 && (
                      <div className="mt-5 p-4 bg-warning/10 border border-warning/30 rounded-xl shadow-sm">
                        <h4 className="font-bold text-warning mb-3 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Validation Warnings (you can still generate voices):
                        </h4>
                        <ul className="list-disc list-inside text-sm text-warning/80 space-y-1">
                          {Object.values(speakerState.validationErrors).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end pt-8 border-t border-base-content/10">
            {Object.values(speakerStates).some(state => !state.isValid) && (
              <div className="alert alert-warning mr-4 flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>Some voice configurations have validation warnings, but you can still proceed.</span>
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-lg min-w-[250px] shadow-lg hover:shadow-xl transition-all duration-300 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Generating Voices...
                </>
              ) : (
                <>
                  Generate Voices
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpeakerConfigForm;