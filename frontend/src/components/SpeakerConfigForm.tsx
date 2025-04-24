import React, { useState, useEffect } from 'react';
import { SpeakerVoiceMapping } from '../types/speaker';
import { useVoice } from '../contexts/VoiceContext';
import { useSpeakerConfig } from '../hooks/useSpeakerConfig';
import { useVoiceSelection } from '../hooks/useVoiceSelection';
import { useVoiceSpeakerMapping } from '../hooks/useVoiceSpeakerMapping';
import { VoiceName, VoiceStyle, VOICE_STYLE_PRESETS } from '../types/voice';
import { Gender, AccentType, VoiceTone, SpeakerConfig } from '../types/base';
import VoiceCard from './VoiceCard';
import VoiceSpeakerSelector from './VoiceSpeakerSelector';
import { CustomSelect } from './CustomSelect';
import { createVoiceConfig } from '../utils/voiceUtils';

interface SpeakerConfigFormProps {
  characters: string[];
  onSubmit: (voiceConfigs: Record<string, SpeakerVoiceMapping>) => Promise<void>;
  isLoading?: boolean;
}

// Component for configuring speakers and voices
const SpeakerConfigForm: React.FC<SpeakerConfigFormProps> = ({
  characters,
  onSubmit,
  isLoading = false
}) => {
  // Hooks and state
  const { voiceOptions, voiceMetadata } = useVoice();
  const { speakerMappings } = useVoiceSpeakerMapping();
  const { selectedVoice, selectVoice, getVoiceMetadata } = useVoiceSelection();
  const [characterMappings, setCharacterMappings] = useState<Record<string, SpeakerVoiceMapping>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCharacter, setCurrentCharacter] = useState<string>(characters[0] || '');

  // Initialize character mappings when component mounts
  useEffect(() => {
    if (characters.length > 0) {
      const initialMappings: Record<string, SpeakerVoiceMapping> = {};
      characters.forEach(character => {
        initialMappings[character] = {
          voice: '' as '', // explicit type casting
          config: null
        };
      });
      setCharacterMappings(initialMappings);
      setCurrentCharacter(characters[0]);
    }
  }, [characters]);

  // Handle voice selection for a character
  const handleVoiceConfigSelect = (character: string, voiceConfig: SpeakerVoiceMapping) => {
    setCharacterMappings(prev => ({
      ...prev,
      [character]: voiceConfig
    }));
  };

  // Check if all characters have voices assigned
  const areAllCharactersMapped = () => {
    return characters.every(character => 
      characterMappings[character]?.voice && characterMappings[character]?.config
    );
  };

  // Move to the next character or submit if all are configured
  const handleNext = () => {
    const currentIndex = characters.indexOf(currentCharacter);
    if (currentIndex < characters.length - 1) {
      setCurrentCharacter(characters[currentIndex + 1]);
    } else {
      handleSubmit();
    }
  };

  // Move to the previous character
  const handlePrevious = () => {
    const currentIndex = characters.indexOf(currentCharacter);
    if (currentIndex > 0) {
      setCurrentCharacter(characters[currentIndex - 1]);
    }
  };

  // Submit all voice configurations
  const handleSubmit = async () => {
    // Only submit if all characters are mapped AND not already loading
    if (areAllCharactersMapped() && !isLoading) {
      try {
        // Set a local loading state to prevent multiple submissions
        const mappingsToSubmit = {...characterMappings};
        await onSubmit(mappingsToSubmit);
      } catch (error) {
        console.error('Error submitting voice configurations:', error);
      }
    }
  };

  // Handle voice selection for the current character
  const handleSelectVoiceConfig = (voiceConfig: SpeakerVoiceMapping) => {
    handleVoiceConfigSelect(currentCharacter, voiceConfig);
  };

  return (
    <div className="speaker-config-form">
      {/* Progress indicators */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Configure Character Voices</h2>
          <div className="text-sm text-base-content/70">
            {characters.indexOf(currentCharacter) + 1} of {characters.length}
          </div>
        </div>
        <div className="flex gap-1">
          {characters.map((character, index) => (
            <div
              key={character}
              className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                character === currentCharacter
                  ? 'bg-primary'
                  : characterMappings[character]?.voice
                  ? 'bg-success/50'
                  : 'bg-base-300'
              }`}
              onClick={() => setCurrentCharacter(character)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
      </div>

      {/* Current character config section */}
      <div className="bg-base-200 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-4">Configuring: {currentCharacter}</h3>
        
        {/* Voice selector component */}
        <VoiceSpeakerSelector
          onSelectVoiceConfig={handleSelectVoiceConfig}
          defaultVoice={
            characterMappings[currentCharacter]?.voice as VoiceName || undefined
          }
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          className="btn btn-outline"
          onClick={handlePrevious}
          disabled={characters.indexOf(currentCharacter) === 0}
        >
          Previous
        </button>
        
        <button
          className={`btn ${
            characters.indexOf(currentCharacter) === characters.length - 1
              ? 'btn-primary'
              : 'btn-accent'
          }`}
          onClick={handleNext}
          disabled={!characterMappings[currentCharacter]?.voice || isLoading}
        >
          {characters.indexOf(currentCharacter) === characters.length - 1
            ? isLoading
              ? 'Submitting...'
              : 'Complete'
            : 'Next Character'}
        </button>
      </div>
    </div>
  );
};

export default SpeakerConfigForm;