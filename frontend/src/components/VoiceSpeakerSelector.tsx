import React, { useState, useEffect } from 'react';
import { SpeakerConfig } from '../types/base';
import { VoiceName, VoiceConfig, VOICE_STYLE_PRESETS, VoiceStyle } from '../types/voice';
import { SpeakerVoiceMapping } from '../types/speaker';
import { useVoice } from '../contexts/VoiceContext';
import { useVoiceSpeakerMapping } from '../hooks/useVoiceSpeakerMapping';
import VoiceCard from './VoiceCard';
import { VOICE_CONFIGS } from '../config/voices';
import { CustomSelect } from './CustomSelect';

interface VoiceSpeakerSelectorProps {
  onSelectVoiceConfig: (voiceConfig: SpeakerVoiceMapping) => void;
  defaultVoice?: VoiceName | '';
  overrides?: Partial<SpeakerConfig>;
}

/**
 * Component for selecting a voice and getting its associated speaker configuration
 */
const VoiceSpeakerSelector: React.FC<VoiceSpeakerSelectorProps> = ({
  onSelectVoiceConfig,
  defaultVoice,
  overrides = {}
}) => {
  const { voiceMetadata, voiceOptions } = useVoice();
  const { 
    speakerMappings, 
    isLoading, 
    error, 
    getSpeakerForVoice, 
    getAllVoiceNames,
    createDefaultSpeakerConfig
  } = useVoiceSpeakerMapping();
  
  const [selectedVoice, setSelectedVoice] = useState<VoiceName | null>(defaultVoice as VoiceName || null);
  const [availableVoices, setAvailableVoices] = useState<VoiceName[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<VoiceStyle>('neutral_professional');
  const [customConfig, setCustomConfig] = useState<Partial<SpeakerConfig>>({});
  const [showCustomization, setShowCustomization] = useState(false);

  // Load all available voices from config
  useEffect(() => {
    // Get all voices from config
    const allVoices = getAllVoiceNames();
    setAvailableVoices(allVoices);
  }, [getAllVoiceNames]);

  // Update selectedVoice when defaultVoice changes
  useEffect(() => {
    if (defaultVoice) {
      setSelectedVoice(defaultVoice as VoiceName);
    }
  }, [defaultVoice]);

  // When a voice is selected, create and send the voice config
  useEffect(() => {
    if (selectedVoice) {
      // Try to get an existing speaker config for this voice
      let speakerConfig = getSpeakerForVoice(selectedVoice);
      
      // If no config exists, create a default one
      if (!speakerConfig) {
        speakerConfig = createDefaultSpeakerConfig(selectedVoice);
      }
      
      // Apply voice style preset if selected
      const stylePreset = VOICE_STYLE_PRESETS[selectedStyle] || {};
      
      // Merge configs: base -> style preset -> custom changes -> overrides
      const configWithStyle = {
        ...speakerConfig,
        ...stylePreset,
        ...customConfig,
        ...overrides,
        voice: selectedVoice // Ensure voice is set correctly and not overridden
      };
      
      // Create voice mapping
      const voiceMapping: SpeakerVoiceMapping = {
        voice: selectedVoice,
        config: configWithStyle
      };
      
      // Send to parent component
      onSelectVoiceConfig(voiceMapping);
    }
  }, [
    selectedVoice, 
    selectedStyle, 
    customConfig,
    overrides, 
    getSpeakerForVoice, 
    createDefaultSpeakerConfig, 
    onSelectVoiceConfig
  ]);

  // Handle voice selection
  const handleSelectVoice = (voice: VoiceName) => {
    setSelectedVoice(voice);
  };

  // Handle style selection
  const handleStyleChange = (style: string) => {
    setSelectedStyle(style as VoiceStyle);
  };

  // Handle custom config changes
  const handleConfigChange = (field: string, value: any) => {
    setCustomConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // If metadata or mappings are loading, show loading state
  if (isLoading || !voiceMetadata) {
    return <div className="p-4 text-center">Loading voice options...</div>;
  }

  // If there was an error loading mappings, show error
  if (error) {
    return <div className="p-4 text-center text-error">{error}</div>;
  }

  // If there are no voices available, show message
  if (availableVoices.length === 0) {
    return <div className="p-4 text-center">No voice options available</div>;
  }

  return (
    <div className="voice-speaker-selector p-6 bg-base-100 rounded-xl shadow-md">
      <h3 className="text-2xl font-semibold mb-6 text-base-content flex items-center gap-3">
        <span className="text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </span>
        Select Voice
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {availableVoices.map((voice) => {
          // Use metadata from voiceMetadata if available, fallback to config
          const metadata = voiceMetadata[voice] || VOICE_CONFIGS[voice];
          return (
            <VoiceCard
              key={voice}
              name={voice}
              metadata={metadata}
              isSelected={selectedVoice === voice}
              onSelect={() => handleSelectVoice(voice)}
              isCompact={true}
              selectedStyle={selectedStyle}
              onStyleChange={handleStyleChange}
            />
          );
        })}
      </div>
      
      {selectedVoice && (
        <div className="mt-8 p-5 bg-base-200 rounded-lg border border-base-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-base-content">Selected Voice: {selectedVoice}</h4>
            <button 
              className="btn btn-sm btn-outline btn-primary" 
              onClick={() => setShowCustomization(!showCustomization)}
            >
              {showCustomization ? 'Hide Options' : 'Customize Voice'}
            </button>
          </div>
          
          <p className="text-sm text-base-content/70 mb-4">
            This voice uses a {getSpeakerForVoice(selectedVoice)?.gender || 'neutral'} speaker 
            with {getSpeakerForVoice(selectedVoice)?.voice_tone || 'professional'} tone and 
            {getSpeakerForVoice(selectedVoice)?.accent || 'neutral'} accent.
          </p>
          
          {showCustomization && (
            <div className="mt-6 p-5 bg-base-100 rounded-lg border border-base-200">
              <h5 className="text-md font-medium mb-4 text-base-content">Voice Style</h5>
              <div className="mb-5">
                <CustomSelect
                  label="Preset Style"
                  value={selectedStyle}
                  onChange={handleStyleChange}
                  options={Object.keys(VOICE_STYLE_PRESETS).map(style => ({
                    value: style,
                    label: style.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')
                  }))}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                <div>
                  <h5 className="text-md font-medium mb-3 text-base-content">Basic Properties</h5>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Gender</span>
                    </label>
                    <select
                      className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                      value={customConfig.gender || (getSpeakerForVoice(selectedVoice)?.gender || 'neutral')}
                      onChange={(e) => handleConfigChange('gender', e.target.value)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Voice Tone</span>
                    </label>
                    <select
                      className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                      value={customConfig.voice_tone || (getSpeakerForVoice(selectedVoice)?.voice_tone || 'professional')}
                      onChange={(e) => handleConfigChange('voice_tone', e.target.value)}
                    >
                      <option value="warm">Warm</option>
                      <option value="professional">Professional</option>
                      <option value="energetic">Energetic</option>
                      <option value="calm">Calm</option>
                      <option value="authoritative">Authoritative</option>
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Accent</span>
                    </label>
                    <select
                      className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                      value={customConfig.accent || (getSpeakerForVoice(selectedVoice)?.accent || 'neutral')}
                      onChange={(e) => handleConfigChange('accent', e.target.value)}
                    >
                      <option value="neutral">Neutral</option>
                      <option value="british">British</option>
                      <option value="american">American</option>
                      <option value="australian">Australian</option>
                      <option value="indian">Indian</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-md font-medium mb-2 text-base-content">Speaking Rate</h5>
                  
                  <div className="form-control mb-2">
                    <label className="label">
                      <span className="label-text font-medium">Normal Rate ({customConfig.speaking_rate?.normal || 150})</span>
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="200"
                      value={customConfig.speaking_rate?.normal || 150}
                      onChange={(e) => handleConfigChange('speaking_rate', {
                        ...(customConfig.speaking_rate || {}),
                        normal: parseInt(e.target.value)
                      })}
                      className="range range-primary range-sm"
                    />
                  </div>
                  
                  <div className="form-control mb-2">
                    <label className="label">
                      <span className="label-text font-medium">Excited Rate ({customConfig.speaking_rate?.excited || 170})</span>
                    </label>
                    <input
                      type="range"
                      min="120"
                      max="220"
                      value={customConfig.speaking_rate?.excited || 170}
                      onChange={(e) => handleConfigChange('speaking_rate', {
                        ...(customConfig.speaking_rate || {}),
                        excited: parseInt(e.target.value)
                      })}
                      className="range range-secondary range-sm"
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Analytical Rate ({customConfig.speaking_rate?.analytical || 130})</span>
                    </label>
                    <input
                      type="range"
                      min="80"
                      max="180"
                      value={customConfig.speaking_rate?.analytical || 130}
                      onChange={(e) => handleConfigChange('speaking_rate', {
                        ...(customConfig.speaking_rate || {}),
                        analytical: parseInt(e.target.value)
                      })}
                      className="range range-accent range-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceSpeakerSelector; 