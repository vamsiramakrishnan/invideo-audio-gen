import React from 'react';

interface VoiceConfig {
  icon: string;
  color: string;
  description: string;
}

interface CharacterMappingProps {
  character: string;
  voices: Record<string, VoiceConfig>;
  selectedVoice: string;
  onVoiceSelect: (voice: string) => void;
}

const CharacterMapping: React.FC<CharacterMappingProps> = ({
  character,
  voices,
  selectedVoice,
  onVoiceSelect,
}) => {
  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h3 className="card-title flex items-center gap-2">
          <span className="text-xl">👤</span>
          {character}
        </h3>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Select voice for this character</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={selectedVoice}
            onChange={(e) => onVoiceSelect(e.target.value)}
          >
            <option value="">Choose a voice</option>
            {Object.entries(voices).map(([name, config]) => (
              <option key={name} value={name}>
                {config.icon} {name} - {config.description}
              </option>
            ))}
          </select>
        </div>
        {selectedVoice && voices[selectedVoice] && (
          <div 
            className="mt-2 p-2 rounded-lg flex items-center gap-2"
            style={{ backgroundColor: `${voices[selectedVoice].color}20` }}
          >
            <span className="text-2xl">{voices[selectedVoice].icon}</span>
            <div className="flex-1">
              <div className="font-medium">{selectedVoice}</div>
              <div className="text-sm opacity-70">{voices[selectedVoice].description}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterMapping; 