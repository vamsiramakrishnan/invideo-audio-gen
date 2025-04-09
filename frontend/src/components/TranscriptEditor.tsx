import React, { useState, useEffect, useMemo } from 'react';
import { SpeakerVoiceMapping } from '../types/speaker';
import { DialogTurn, parseTranscript, turnsToText } from '../utils/transcriptUtils';

// Define base theme colors for dynamic assignment
const THEME_COLORS = [
  {
    gradient: 'from-primary/20 to-primary-focus/10',
    bgGradient: 'bg-gradient-to-r from-primary/10 via-primary-focus/5 to-primary/10',
    accentColor: 'text-primary',
    borderColor: 'border-primary/30',
    bgColor: 'bg-primary',
    textColor: 'text-primary-content'
  },
  {
    gradient: 'from-secondary/20 to-secondary-focus/10',
    bgGradient: 'bg-gradient-to-r from-secondary/10 via-secondary-focus/5 to-secondary/10',
    accentColor: 'text-secondary',
    borderColor: 'border-secondary/30',
    bgColor: 'bg-secondary',
    textColor: 'text-secondary-content'
  },
  {
    gradient: 'from-accent/20 to-accent-focus/10',
    bgGradient: 'bg-gradient-to-r from-accent/10 via-accent-focus/5 to-accent/10',
    accentColor: 'text-accent',
    borderColor: 'border-accent/30',
    bgColor: 'bg-accent',
    textColor: 'text-accent-content'
  },
  {
    gradient: 'from-info/20 to-info-focus/10',
    bgGradient: 'bg-gradient-to-r from-info/10 via-info-focus/5 to-info/10',
    accentColor: 'text-info',
    borderColor: 'border-info/30',
    bgColor: 'bg-info',
    textColor: 'text-info-content'
  },
  {
    gradient: 'from-success/20 to-success-focus/10',
    bgGradient: 'bg-gradient-to-r from-success/10 via-success-focus/5 to-success/10',
    accentColor: 'text-success',
    borderColor: 'border-success/30',
    bgColor: 'bg-success',
    textColor: 'text-success-content'
  }
];

const DEFAULT_THEME = {
  gradient: 'from-neutral-500/20 to-neutral-600/10',
  bgGradient: 'bg-gradient-to-r from-neutral-500/10 via-neutral-400/5 to-neutral-500/10',
  accentColor: 'text-neutral-600',
  borderColor: 'border-neutral-300',
  bgColor: 'bg-neutral-focus',
  textColor: 'text-neutral-content'
};

interface SpeakerTheme {
  gradient: string;
  icon: JSX.Element;
  accentColor: string;
  bgGradient: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}

interface TranscriptEditorProps {
  turns: DialogTurn[];
  onTurnUpdate: (index: number, updatedTurn: Partial<DialogTurn>) => void;
  onAddTurn: (index: number, speaker?: string) => void;
  onDeleteTurn: (index: number) => void;
  onMoveTurn: (fromIndex: number, direction: 'up' | 'down') => void;
  onSave: () => void;
  isDirty: boolean;
  isLoading: boolean;
  characters: string[];
  voiceMappings?: Record<string, SpeakerVoiceMapping>;
  onGenerateSegmentAudio?: (speaker: string, text: string) => Promise<string>;
  wordCount: number | null;
  estimatedDurationMinutes: number | null;
  targetDurationMinutes: number | null;
  onExtendTranscript?: () => Promise<void>;
  isExtending?: boolean;
}

const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  turns,
  onTurnUpdate,
  onAddTurn,
  onDeleteTurn,
  onMoveTurn,
  onSave,
  isDirty,
  isLoading,
  characters,
  voiceMappings = {},
  onGenerateSegmentAudio,
  wordCount,
  estimatedDurationMinutes,
  targetDurationMinutes,
  onExtendTranscript,
  isExtending = false,
}) => {
  const [selectedTurnIndex, setSelectedTurnIndex] = useState<number | null>(null);
  const [generatingAudioForIndex, setGeneratingAudioForIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioGenerationSuccess, setAudioGenerationSuccess] = useState<number | null>(null);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const audioRefs = React.useRef<Record<string, HTMLAudioElement | null>>({});
  
  // Keep track of unique speakers and their themes
  const speakerThemes = useMemo(() => {
    const themes: Record<string, SpeakerTheme> = {};
    
    // Create a theme for each character
    characters.forEach((character, index) => {
      const themeColor = THEME_COLORS[index % THEME_COLORS.length];
      themes[character] = {
        gradient: themeColor.gradient,
        bgGradient: themeColor.bgGradient,
        accentColor: themeColor.accentColor,
        borderColor: themeColor.borderColor,
        bgColor: themeColor.bgColor,
        textColor: themeColor.textColor,
        icon: (
          <div className="avatar placeholder">
            <div className={`${themeColor.bgColor} ${themeColor.textColor} rounded-full w-8`}>
              <span className="text-xs">{character.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        )
      };
    });

    // Add default theme
    themes['default'] = {
      gradient: DEFAULT_THEME.gradient,
      bgGradient: DEFAULT_THEME.bgGradient,
      accentColor: DEFAULT_THEME.accentColor,
      borderColor: DEFAULT_THEME.borderColor,
      bgColor: DEFAULT_THEME.bgColor,
      textColor: DEFAULT_THEME.textColor,
      icon: (
        <div className="avatar placeholder">
          <div className={`${DEFAULT_THEME.bgColor} ${DEFAULT_THEME.textColor} rounded-full w-8`}>
            <span className="text-xs">?</span>
          </div>
        </div>
      )
    };

    return themes;
  }, [characters]);

  // Get theme for a speaker
  const getSpeakerTheme = (speaker: string): SpeakerTheme => {
    return speakerThemes[speaker] || speakerThemes.default;
  };

  const handleTurnUpdate = (index: number, updatedTurn: Partial<DialogTurn>) => {
    onTurnUpdate(index, updatedTurn);
  };

  const handleAddTurn = (index: number) => {
    const defaultSpeaker = characters.length > 0 ? characters[0] : '';
    onAddTurn(index, defaultSpeaker);
    setSelectedTurnIndex(index + 1);
  };

  const handleDeleteTurn = (index: number) => {
    onDeleteTurn(index);
    setSelectedTurnIndex(null);
  };

  const handleMoveTurn = (fromIndex: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && fromIndex === 0) || 
        (direction === 'down' && fromIndex === turns.length - 1)) return;

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    onMoveTurn(fromIndex, direction);
    setSelectedTurnIndex(toIndex);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  const handleGenerateAudio = async (index: number) => {
    try {
      const turn = turns[index];
      
      if (!turn.speaker) {
        throw new Error("Speaker is required to generate audio");
      }
      
      if (!onGenerateSegmentAudio) {
        throw new Error("Audio generation function not provided");
      }
      
      // Check if we have a voice mapping for this speaker
      if (!voiceMappings[turn.speaker]) {
        throw new Error(`No voice mapping found for speaker: ${turn.speaker}`);
      }
      
      setGeneratingAudioForIndex(index);
      setAudioGenerationSuccess(null);
      setError(null);
      
      // Generate audio using the provided function
      const audioUrl = await onGenerateSegmentAudio(turn.speaker, turn.content);
      
      // Update the turn with the new audio URL
      onTurnUpdate(index, { audioUrl });
      
      // Show success state briefly
      setAudioGenerationSuccess(index);
      setTimeout(() => {
        if (setAudioGenerationSuccess) {
          setAudioGenerationSuccess(null);
        }
      }, 2000);
      
      return true;
    } catch (err) {
      console.error('Error generating audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
      return false;
    } finally {
      setGeneratingAudioForIndex(null);
    }
  };

  // Generate audio for all turns that don't have audio yet
  const handleBatchGenerateAudio = async () => {
    try {
      setIsBatchGenerating(true);
      setError(null);
      
      // Find all turns that need audio
      const turnsNeedingAudio = turns.reduce<number[]>((acc, turn, index) => {
        if (canGenerateAudio(turn) && !turn.audioUrl) {
          acc.push(index);
        }
        return acc;
      }, []);
      
      if (turnsNeedingAudio.length === 0) {
        console.log("No turns need audio generation");
        return;
      }
      
      // Generate audio for each turn sequentially
      let successCount = 0;
      for (const index of turnsNeedingAudio) {
        const success = await handleGenerateAudio(index);
        if (success) successCount++;
        
        // Small delay between requests to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (successCount === 0) {
        setError("Failed to generate audio for any turns during batch");
      }
    } catch (err) {
      console.error('Error in batch audio generation:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio in batch');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const canGenerateAudio = (turn: DialogTurn) => {
    return Boolean(
      turn.speaker && 
      turn.content && 
      voiceMappings && 
      voiceMappings[turn.speaker] &&
      onGenerateSegmentAudio
    );
  };

  // Handle audio playback
  const handlePlayAudio = (index: number, audioUrl: string) => {
    try {
      // Stop any currently playing audio
      if (playingAudioIndex !== null && playingAudioIndex !== index) {
        const currentAudioId = turns[playingAudioIndex]?.id;
        if (currentAudioId && audioRefs.current[currentAudioId]) {
          audioRefs.current[currentAudioId]?.pause();
          audioRefs.current[currentAudioId]?.load();
        }
      }

      const audioId = turns[index].id;
      
      // Create audio element if it doesn't exist
      if (!audioRefs.current[audioId]) {
        const audio = new Audio(audioUrl);
        audioRefs.current[audioId] = audio;
        
        audio.addEventListener('ended', () => {
          setPlayingAudioIndex(null);
        });
        
        audio.addEventListener('error', () => {
          setError('Failed to play audio');
          setPlayingAudioIndex(null);
        });
      }
      
      const audioElement = audioRefs.current[audioId];
      
      if (audioElement) {
        if (playingAudioIndex === index) {
          // If already playing, pause it
          audioElement.pause();
          setPlayingAudioIndex(null);
        } else {
          // Otherwise play it
          audioElement.play().catch(err => {
            console.error('Error playing audio:', err);
            setError('Failed to play audio');
            setPlayingAudioIndex(null);
          });
          setPlayingAudioIndex(index);
        }
      }
    } catch (err) {
      console.error('Error handling audio playback:', err);
      setError('Failed to play audio');
      setPlayingAudioIndex(null);
    }
  };

  // Handle transcript extension
  const handleExtendTranscript = async () => {
    if (!onExtendTranscript || isExtending) return;

    setError(null); // Clear previous errors

    try {
      await onExtendTranscript();
      setSelectedTurnIndex(null);
    } catch (err) {
      console.error('Error extending transcript:', err);
      setError(err instanceof Error ? err.message : 'Failed to extend transcript');
    } 
    // Loading state (isExtending) is managed by the parent component via props
  };

  // Clean up audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      audioRefs.current = {};
    };
  }, []);

  // Determine if the extend button should be shown and enabled
  const canExtend = useMemo(() => {
    return (
      onExtendTranscript &&
      targetDurationMinutes !== null &&
      estimatedDurationMinutes !== null &&
      estimatedDurationMinutes < targetDurationMinutes
    );
  }, [onExtendTranscript, targetDurationMinutes, estimatedDurationMinutes]);

  return (
    <div className="card glass shadow-xl border border-base-content/10">
      <div className="card-body p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="card-title text-xl flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </span>
            Transcript Editor
          </h2>
          <div className="flex gap-2">
            {onGenerateSegmentAudio && turns.some(turn => canGenerateAudio(turn) && !turn.audioUrl) && (
              <button 
                className={`
                  btn btn-sm btn-accent gap-1
                  ${isBatchGenerating ? 'animate-pulse' : ''}
                `}
                onClick={handleBatchGenerateAudio}
                disabled={isBatchGenerating || isLoading}
              >
                {isBatchGenerating ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Generating Audio...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Generate All Audio
                  </>
                )}
              </button>
            )}
            {canExtend && (
              <button
                className={`btn btn-sm btn-secondary gap-1 ${isExtending ? 'loading' : ''}`}
                onClick={handleExtendTranscript}
                disabled={isExtending || isLoading}
              >
                {!isExtending && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
                {isExtending ? 'Extending...' : 'Extend Transcript'}
              </button>
            )}
            <button 
              className="btn btn-sm btn-primary"
              onClick={handleSubmit}
              disabled={isLoading || !isDirty || turns.length === 0}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="flex justify-between items-center bg-base-200/50 backdrop-blur-sm rounded-lg p-4 border border-base-content/10 mb-4 shadow-inner">
          <div className="stat">
            <div className="stat-title text-base-content/70">Word Count</div>
            <div className="stat-value text-lg font-semibold">{wordCount ?? '-'}</div>
          </div>
          <div className="stat">
            <div className="stat-title text-base-content/70">Est. Duration</div>
            <div className="stat-value text-lg font-semibold">
              {estimatedDurationMinutes !== null ? `${estimatedDurationMinutes} min` : '-'}
              {targetDurationMinutes !== null && (
                 <span className="text-sm font-normal text-base-content/50"> / {targetDurationMinutes} min target</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {turns.map((turn, index) => {
            const theme = getSpeakerTheme(turn.speaker);
            
            return (
              <div 
                key={turn.id} 
                className={`
                  relative rounded-xl p-0.5 transition-all duration-300
                  ${index === selectedTurnIndex ? 'scale-[1.01] z-10' : 'hover:scale-[1.005]'}
                  ${theme.gradient}
                `}
              >
                <div 
                  className={`
                    rounded-xl bg-base-100 p-5 relative overflow-hidden
                    ${index === selectedTurnIndex ? 'ring-2 ring-primary/30 shadow-lg' : ''}
                  `}
                  onClick={() => setSelectedTurnIndex(index)}
                >
                  {/* Background gradient effect */}
                  <div className={`absolute inset-0 opacity-5 ${theme.bgGradient}`}></div>
                  
                  {/* Audio status indicator */}
                  {turn.audioUrl && (
                    <div className="absolute top-2 right-2">
                      <div className="badge badge-sm badge-primary gap-1 opacity-70">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414-9.9m-2.828 9.9a9 9 0 010-12.728" />
                        </svg>
                        <span className="text-xs">Audio Ready</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${theme.bgColor} ${theme.textColor} shadow-md
                        `}>
                          {theme.icon}
                        </div>
                        <div>
                          <select
                            className={`
                              select select-sm w-full max-w-xs font-medium
                              focus:outline-none focus:ring-2 focus:ring-primary/30
                              ${theme.accentColor} bg-base-200/50
                            `}
                            value={turn.speaker}
                            onChange={(e) => handleTurnUpdate(index, { speaker: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {characters.map((character) => (
                              <option key={character} value={character}>
                                {character}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {turn.audioUrl && (
                          <div className="tooltip tooltip-left" data-tip={playingAudioIndex === index ? "Pause audio" : "Play audio"}>
                            <button 
                              className={`
                                btn btn-circle btn-sm 
                                ${playingAudioIndex === index ? theme.bgColor : 'btn-outline ' + theme.borderColor} 
                                ${playingAudioIndex === index ? theme.textColor : theme.accentColor}
                                hover:scale-110 transition-all duration-200 ease-in-out
                                shadow-md hover:shadow-lg
                                ${playingAudioIndex === index ? 'animate-pulse' : ''}
                              `}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayAudio(index, turn.audioUrl!);
                              }}
                              aria-label={`${playingAudioIndex === index ? 'Pause' : 'Play'} ${turn.speaker}'s audio`}
                            >
                              {playingAudioIndex === index ? (
                                <div className="relative">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                  </span>
                                </div>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                        
                        {onGenerateSegmentAudio && canGenerateAudio(turn) && (
                          <div className="tooltip tooltip-left" data-tip={turn.audioUrl ? "Regenerate audio" : "Generate audio"}>
                            <button 
                              className={`
                                relative btn ${turn.audioUrl ? 'btn-outline' : ''} btn-circle btn-sm 
                                ${theme.bgColor} ${theme.textColor}
                                hover:scale-110 transition-all duration-200 ease-in-out
                                shadow-md hover:shadow-lg
                                ${generatingAudioForIndex === index ? 'animate-pulse' : ''}
                                ${audioGenerationSuccess === index ? 'ring-4 ring-success/50' : ''}
                              `}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateAudio(index);
                              }}
                              disabled={generatingAudioForIndex === index}
                              aria-label={`Generate audio for ${turn.speaker}`}
                            >
                              {generatingAudioForIndex === index ? (
                                <div className="flex items-center justify-center">
                                  <span className="loading loading-spinner loading-xs"></span>
                                  <span className="sr-only">Generating audio...</span>
                                </div>
                              ) : audioGenerationSuccess === index ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <div className="flex items-center justify-center relative">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                  </svg>
                                  {!turn.audioUrl && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          </div>
                        )}
                        
                        <div className="tooltip tooltip-left" data-tip="Move up">
                          <button 
                            className="btn btn-circle btn-sm btn-ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveTurn(index, 'up');
                            }}
                            disabled={index === 0}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="tooltip tooltip-left" data-tip="Move down">
                          <button 
                            className="btn btn-circle btn-sm btn-ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveTurn(index, 'down');
                            }}
                            disabled={index === turns.length - 1}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="tooltip tooltip-left" data-tip="Delete">
                          <button 
                            className="btn btn-circle btn-sm btn-ghost text-error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTurn(index);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <textarea
                      className={`
                        textarea textarea-bordered w-full min-h-[100px] bg-base-200/50
                        focus:outline-none focus:ring-2 focus:ring-primary/30
                        ${theme.borderColor}
                      `}
                      value={turn.content}
                      onChange={(e) => handleTurnUpdate(index, { content: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={`Enter ${turn.speaker || 'dialogue'}...`}
                    />
                    
                    <div className="flex justify-between items-center">
                      <button
                        className="btn btn-sm btn-ghost gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddTurn(index);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Turn After
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-base-content/50">
                          {turn.content.length} characters
                        </div>
                        
                        {canGenerateAudio(turn) && !turn.audioUrl && (
                          <div className="tooltip tooltip-left" data-tip="This turn needs audio">
                            <div className="badge badge-sm badge-outline badge-warning gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span className="text-xs">Needs Audio</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {turns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-base-200 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No dialogue yet</h3>
            <p className="text-base-content/60 max-w-md mb-6">
              Start by adding your first dialogue turn. Each turn represents a character's speech.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => handleAddTurn(-1)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First Turn
            </button>
          </div>
        )}
        
        {turns.length > 0 && (
          <div className="flex justify-center mt-6">
            <button
              className="btn btn-outline btn-primary"
              onClick={() => handleAddTurn(turns.length - 1)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Turn
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptEditor;