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

// Enhanced SpeakerConfigForm component
const SpeakerConfigForm: React.FC<SpeakerConfigFormProps> = ({
  characters,
  onSubmit,
  isLoading = false,
}) => {
  const [characterMappings, setCharacterMappings] = useState<
    Record<string, SpeakerVoiceMapping>
  >({});
  const [currentCharacter, setCurrentCharacter] = useState<string>(
    characters[0] || ''
  );

  useEffect(() => {
    if (characters.length > 0) {
      const initialMappings: Record<string, SpeakerVoiceMapping> = {};
      characters.forEach((character) => {
        initialMappings[character] = {
          voice: '' as '', // explicit type casting for empty string as VoiceName subset
          config: null,
        };
      });
      setCharacterMappings(initialMappings);
      if (!characters.includes(currentCharacter) && characters.length > 0) {
        setCurrentCharacter(characters[0]);
      } else if (!currentCharacter && characters.length > 0) {
        setCurrentCharacter(characters[0]);
      }
    }
  }, [characters]);

  useEffect(() => {
    if (characters.length > 0 && !currentCharacter) {
      setCurrentCharacter(characters[0]);
    }
  }, [characters, currentCharacter]);

  const handleVoiceConfigSelect = (
    character: string,
    voiceConfig: SpeakerVoiceMapping
  ) => {
    setCharacterMappings((prev) => ({
      ...prev,
      [character]: voiceConfig,
    }));
  };

  const areAllCharactersMapped = () => {
    if (Object.keys(characterMappings).length === 0 && characters.length > 0) return false;
    return characters.every(
      (character) =>
        characterMappings[character]?.voice && characterMappings[character]?.config
    );
  };

  const handleNext = () => {
    const currentIndex = characters.indexOf(currentCharacter);
    if (currentIndex < characters.length - 1) {
      setCurrentCharacter(characters[currentIndex + 1]);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    const currentIndex = characters.indexOf(currentCharacter);
    if (currentIndex > 0) {
      setCurrentCharacter(characters[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (areAllCharactersMapped() && !isLoading) {
      try {
        const mappingsToSubmit = { ...characterMappings };
        await onSubmit(mappingsToSubmit);
      } catch (error) {
        console.error('Error submitting voice configurations:', error);
        // Add user feedback for error here if needed
      }
    } else {
      console.log("Submit condition not met: ", {areAllCharactersMapped: areAllCharactersMapped(), isLoading});
    }
  };

  const handleSelectVoiceConfig = (voiceConfig: SpeakerVoiceMapping) => {
    handleVoiceConfigSelect(currentCharacter, voiceConfig);
  };

  const currentCharacterIndex = characters.indexOf(currentCharacter);
  const isLastCharacter = currentCharacterIndex === characters.length - 1;

  if (characters.length === 0) {
      return <div className="p-6 bg-base-100 rounded-xl shadow-lg text-base-content">No characters available for configuration.</div>;
  }

  return (
    <div className="speaker-config-form p-6 md:p-8 bg-base-100 rounded-2xl shadow-xl border border-base-300/20 max-w-4xl mx-auto">
      {/* Progress indicators & Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
          <h2 className="text-3xl font-bold text-base-content mb-2 sm:mb-0">
            Configure Character Voices
          </h2>
          <div className="text-sm font-medium text-base-content/80 bg-base-200 px-3 py-1 rounded-full shadow-sm self-end sm:self-center">
            Step <span className="font-bold text-primary">{currentCharacterIndex + 1}</span> of {characters.length}
          </div>
        </div>
        <p className="text-base-content/70 mb-6 text-sm md:text-base">
            Assign a unique voice and speaking style for each character in your story. Click on a character below to configure their voice.
        </p>
        <div className="flex space-x-1 md:space-x-1.5 items-end overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-200">
          {characters.map((character, index) => (
            <div
              key={character}
              className={`flex-1 min-w-[80px] md:min-w-[100px] flex flex-col items-center group cursor-pointer transition-all duration-200 ease-in-out ${character === currentCharacter ? 'transform scale-105' : 'opacity-70 hover:opacity-100'}`}
              onClick={() => setCurrentCharacter(character)}
              title={`Configure ${character}`}
            >
              <div
                className={`w-full h-2.5 rounded-t-md transition-all duration-300 ease-in-out mb-1 ${
                  character === currentCharacter
                    ? 'bg-primary h-3.5'
                    : characterMappings[character]?.voice
                    ? 'bg-success group-hover:bg-success/80'
                    : 'bg-base-300 group-hover:bg-base-content/20'
                }`}
              />
              <span className={`text-xs md:text-sm text-center font-medium transition-all duration-300 ease-in-out px-1 leading-tight ${
                character === currentCharacter
                  ? 'text-primary font-semibold'
                  : characterMappings[character]?.voice
                  ? 'text-success/90'
                  : 'text-base-content/70'
              } group-hover:text-base-content/90`}>
                {character}
                 {characterMappings[character]?.voice && character !== currentCharacter && ' ✓'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current character config section */}
      <div className="bg-gradient-to-br from-base-200/60 to-base-300/30 p-6 md:p-8 rounded-xl mb-8 border border-base-300/30 shadow-inner relative overflow-hidden backdrop-blur-sm">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/10 rounded-full opacity-40 blur-3xl animate-pulse animation-delay-300"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-accent/5 rounded-full opacity-30 blur-3xl animate-pulse"></div>

        <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-2">
                <h3 className="text-2xl font-semibold text-base-content flex items-center gap-3">
                    <span className="relative">
                        Configuring: <span className="text-primary font-bold">{currentCharacter}</span>
                        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary/30 rounded-full"></span>
                    </span>
                </h3>
                 {characterMappings[currentCharacter]?.voice && (
                     <span className="text-sm text-success font-medium flex items-center gap-1.5 bg-success/10 px-2.5 py-1 rounded-full">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         Voice Selected
                     </span>
                 )}
            </div>

            <p className="text-base-content/75 mb-6 text-sm md:text-base">
                Select or adjust the voice for <strong className='font-semibold'>{currentCharacter}</strong>. Changes are saved automatically for this character as you select.
            </p>

            <VoiceSpeakerSelector
              key={currentCharacter} // Re-mount when character changes for default value
              onSelectVoiceConfig={handleSelectVoiceConfig}
              defaultVoice={
                characterMappings[currentCharacter]?.voice as VoiceName || undefined
              }
            />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-base-300/30 gap-4">
        <button
          className="btn btn-ghost btn-md w-full sm:w-auto"
          onClick={handlePrevious}
          disabled={currentCharacterIndex === 0 || isLoading}
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
         {isLastCharacter && !areAllCharactersMapped() && (
             <span className="text-xs text-warning/80 order-last sm:order-first">Assign voices to all characters to complete.</span>
         )}
          <button
            className={`btn btn-md w-full sm:w-auto ${
              isLastCharacter
                ? 'btn-primary'
                : 'btn-accent'
            } ${isLoading ? 'loading' : ''} min-w-[180px]`}
            onClick={handleNext}
            disabled={!characterMappings[currentCharacter]?.voice || (isLastCharacter && !areAllCharactersMapped()) || isLoading}
          >
            {isLoading ? (
                isLastCharacter ? 'Submitting...' : 'Saving...'
            ) : isLastCharacter ? (
                <>
                Complete Configuration
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </>
            ) : (
              <>
                Next Character
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakerConfigForm;