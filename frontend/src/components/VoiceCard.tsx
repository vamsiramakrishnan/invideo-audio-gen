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
        card bg-base-100 transition-all duration-300 ease-in-out group relative overflow-hidden rounded-lg
        border 
        ${isSelected 
          ? 'border-primary shadow-lg scale-[1.03] ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100' 
          : 'border-base-300 hover:border-primary/40 hover:shadow-md hover:scale-[1.01]'
        }
        cursor-pointer
      `}
      onClick={onSelect}
    >
      {/* Optional: Add a subtle background pattern or gradient on hover/select */}
      {/* {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 pointer-events-none"></div>} */}

      <div className="card-body p-4 md:p-5">
        <div className="flex items-center gap-4">
          {/* --- Refined Icon Container --- */}
          <div 
            className={`
              flex-shrink-0 p-3 rounded-lg text-2xl shadow-sm
              transition-all duration-300 transform
              ${isSelected ? 'scale-110' : 'group-hover:scale-105'}
            `}
            style={{ 
              backgroundColor: `${metadata.color}20`, // Slightly less intense background
              color: metadata.color,
              // border: `1px solid ${metadata.color}40` // Optional border
            }}
          >
            <div className="relative z-10 w-6 h-6 flex items-center justify-center">{metadata.icon}</div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className={`
                font-semibold text-base md:text-lg mb-0.5 truncate 
                ${isSelected 
                  ? 'text-primary' 
                  : 'text-base-content group-hover:text-primary/90'
                }
                transition-colors duration-200
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
            {!isCompact && metadata.description && (
              <p className="text-sm text-base-content/70 leading-normal line-clamp-2 mt-1 group-hover:text-base-content/80 transition-colors duration-200">
                {metadata.description}
              </p>
            )}
          </div>
        </div>

        {/* --- Style Selector & Tags Section (Conditional) --- */}
        {(isSelected || (!isCompact && metadata.tags)) && (
          <div 
            className={`
              mt-4 pt-4 border-t border-base-300/70 
              transition-all duration-300 ease-in-out overflow-hidden
              ${isSelected ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'} 
            `}
          >
            {/* Voice style selector - Only show when selected */}
            {isSelected && onStyleChange && (
              <div className="mb-3" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
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
                  // Add some styling if CustomSelect accepts className or specific props
                  // className="select-sm bg-base-200/50 border-base-300" 
                />
                {/* Optional: Show style description inline */}
                {selectedStyle && VOICE_STYLE_PRESETS[selectedStyle] && (
                  <p className="text-xs text-base-content/60 mt-1.5 px-1 leading-tight">
                    {getStyleDescription(selectedStyle)}
                  </p>
                )}
              </div>
            )}

            {/* Voice characteristics tags */}
            {metadata.tags && (
              <div className="flex flex-wrap gap-1.5">
                {metadata.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className={`
                      px-2.5 py-0.5 rounded-full text-xs font-medium
                      transition-all duration-200
                      ${isSelected 
                        ? 'bg-primary/10 text-primary'
                        : 'bg-base-200 text-base-content/70 group-hover:bg-primary/10 group-hover:text-primary/80'
                      }
                    `}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
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