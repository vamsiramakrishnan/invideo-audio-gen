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

  // Handle style change with better error handling
  const handleStyleChange = (value: string) => {
    if (onStyleChange) {
      try {
        // Validate that the style exists in our presets
        if (Object.keys(VOICE_STYLE_PRESETS).includes(value)) {
          onStyleChange(value as VoiceStyle);
        } else {
          console.error(`Invalid voice style: ${value}`);
          // Fallback to a default style if the selected one is invalid
          onStyleChange('neutral_professional');
        }
      } catch (error) {
        console.error('Error changing voice style:', error);
        // Fallback to a default style on error
        onStyleChange('neutral_professional');
      }
    }
  };

  return (
    <div
      className={`
        card backdrop-blur-sm transition-all duration-300 group
        ${isSelected 
          ? 'border-2 border-primary/40 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10 scale-[1.02] ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100' 
          : 'border border-base-content/10 hover:border-primary/20 bg-gradient-to-br from-base-200/40 to-base-300/40 hover:from-base-200/60 hover:to-base-300/60 hover:scale-[1.01] hover:shadow-lg'
        }
        cursor-pointer relative overflow-hidden rounded-2xl
      `}
      onClick={onSelect}
    >
      {/* Selection indicator - subtle glow effect */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent pointer-events-none" />
      )}
      
      {/* Hover effect - more subtle and elegant */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 pointer-events-none" />

      <div className="card-body p-5">
        <div className="flex items-start gap-4">
          <div 
            className={`
              p-4 rounded-2xl text-2xl relative overflow-hidden
              transition-all duration-500 transform
              ${isSelected ? 'scale-110 rotate-3' : 'group-hover:scale-105 group-hover:rotate-1'}
              backdrop-blur-sm shadow-lg
            `}
            style={{ 
              backgroundColor: `${metadata.color}30`,
              color: metadata.color,
              boxShadow: `0 10px 30px -10px ${metadata.color}50`
            }}
          >
            {/* Icon background effect - more refined */}
            <div 
              className="absolute inset-0 opacity-70 mix-blend-overlay"
              style={{
                backgroundImage: `radial-gradient(circle at center, ${metadata.color}50 0%, transparent 70%)`
              }}
            />
            <div className="relative z-10">{metadata.icon}</div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className={`
                font-bold text-lg mb-1 truncate
                ${isSelected 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary' 
                  : 'text-base-content/90 group-hover:text-primary/80'
                }
                transition-colors duration-300
              `}>
                {name}
              </h3>
              {isSelected && (
                <div className="text-primary animate-fadeIn shrink-0 bg-primary/10 p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            {!isCompact && (
              <p className="text-sm text-base-content/70 leading-relaxed line-clamp-2 group-hover:text-base-content/80 transition-colors duration-300">
                {metadata.description}
              </p>
            )}
          </div>
        </div>

        {/* Voice style selector - Only show when selected */}
        {isSelected && onStyleChange && (
          <div className="mt-5 pt-4 border-t border-base-content/10">
            <div className="flex items-center gap-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="flex-1">
                <CustomSelect
                  label="Voice Style"
                  value={selectedStyle || 'neutral_professional'}
                  onChange={handleStyleChange}
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
                  className="btn btn-circle btn-ghost btn-sm hover:bg-primary/10 hover:text-primary transition-all duration-300"
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
          <div className="mt-5 pt-4 border-t border-base-content/10">
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag, index) => (
                <span 
                  key={index}
                  className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    transition-all duration-300
                    ${isSelected 
                      ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary shadow-sm shadow-primary/10'
                      : 'bg-base-content/10 text-base-content/70 group-hover:bg-primary/10 group-hover:text-primary/80'
                    }
                  `}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Show style description when selected */}
        {isSelected && selectedStyle && VOICE_STYLE_PRESETS[selectedStyle] && (
          <div className="mt-5 pt-4 border-t border-base-content/10">
            <div className="bg-base-100/50 p-3 rounded-xl shadow-inner">
              <p className="text-xs text-base-content/70 leading-relaxed">
                <span className="font-medium text-primary">Style:</span> {getStyleDescription(selectedStyle)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get style descriptions
function getStyleDescription(style: VoiceStyle): string {
  switch (style) {
    case 'neutral_professional':
      return 'A balanced, clear voice suitable for business and informational content.';
    case 'warm_casual':
      return 'A friendly, approachable voice with natural warmth and conversational tone.';
    case 'authoritative_formal':
      return 'A commanding, confident voice that conveys expertise and authority.';
    case 'friendly_conversational':
      return 'An engaging, personable voice ideal for casual discussions and interviews.';
    case 'energetic_dynamic':
      return 'A lively, enthusiastic voice with varied pitch and expressive delivery.';
    case 'calm_soothing':
      return 'A gentle, reassuring voice with a measured pace and smooth delivery.';
    case 'analytical_precise':
      return 'A clear, methodical voice focused on accuracy and detailed explanation.';
    case 'storytelling_engaging':
      return 'An expressive, captivating voice that brings narratives to life.';
    default:
      return 'Custom voice style with personalized settings.';
  }
}

export default VoiceCard;