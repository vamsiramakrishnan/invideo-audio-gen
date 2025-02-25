import React, { useState } from 'react';
import { VoiceName, VoiceStyle, VOICE_STYLE_PRESETS } from '../types/voice';
import { VoiceMetadata } from '../types/voice';
import { CustomSelect } from './CustomSelect';

interface VoiceCardProps {
  name: VoiceName;
  metadata: VoiceMetadata;
  isSelected: boolean;
  onSelect: () => void;
  isCompact?: boolean;
  selectedStyle?: VoiceStyle;
  onStyleChange?: (style: VoiceStyle) => void;
}

const VoiceCard: React.FC<VoiceCardProps> = ({
  name,
  metadata,
  isSelected,
  onSelect,
  isCompact = false,
  selectedStyle,
  onStyleChange,
}) => {
  const [isEditingStyle, setIsEditingStyle] = useState(false);

  return (
    <div
      className={`
        card backdrop-blur-lg border border-base-content/5
        transition-all duration-500 group
        ${isSelected 
          ? 'bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]' 
          : 'bg-base-200/50 hover:bg-base-200/70 hover:scale-[1.01]'
        }
        cursor-pointer relative overflow-hidden
      `}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 bg-primary/5 animate-pulse-subtle pointer-events-none" />
      )}
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 pointer-events-none" />

      <div className="card-body p-6">
        <div className="flex items-start gap-4">
          <div 
            className={`
              p-4 rounded-xl text-2xl relative overflow-hidden
              transition-all duration-500 transform
              ${isSelected ? 'scale-110 rotate-3' : 'group-hover:scale-105'}
              backdrop-blur-sm
            `}
            style={{ 
              backgroundColor: `${metadata.color}15`,
              color: metadata.color,
              boxShadow: `0 8px 32px -8px ${metadata.color}30`
            }}
          >
            {/* Icon background effect */}
            <div 
              className="absolute inset-0 opacity-50 mix-blend-overlay"
              style={{
                backgroundImage: `radial-gradient(circle at center, ${metadata.color}30 0%, transparent 70%)`
              }}
            />
            {metadata.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className={`
                font-semibold text-lg mb-1 truncate
                ${isSelected ? 'text-primary' : 'text-base-content/90'}
              `}>
                {name}
              </h3>
              {isSelected && (
                <div className="text-primary animate-fadeIn shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            {!isCompact && (
              <p className="text-sm text-base-content/60 leading-relaxed line-clamp-2">
                {metadata.description}
              </p>
            )}
          </div>
        </div>

        {/* Voice style selector */}
        {isSelected && onStyleChange && (
          <div className="mt-4 pt-4 border-t border-base-content/5">
            <div className="flex items-center gap-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="flex-1">
                <CustomSelect
                  label="Voice Style"
                  value={selectedStyle || 'neutral_professional'}
                  onChange={(value) => onStyleChange(value as VoiceStyle)}
                  options={Object.keys(VOICE_STYLE_PRESETS).map(style => ({
                    value: style,
                    label: style.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')
                  }))}
                />
              </div>
              {isCompact && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setIsEditingStyle(!isEditingStyle);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Voice characteristics preview */}
        {(!isCompact || (isCompact && isEditingStyle)) && metadata.tags && (
          <div className="mt-4 pt-4 border-t border-base-content/5">
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag, index) => (
                <span 
                  key={index}
                  className={`
                    px-2 py-1 rounded-md text-xs font-medium
                    ${isSelected 
                      ? 'bg-primary/10 text-primary'
                      : 'bg-base-content/5 text-base-content/70'
                    }
                  `}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceCard;