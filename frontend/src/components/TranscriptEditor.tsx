import React, { useState, useEffect, useMemo } from 'react';

interface DialogTurn {
  speaker: string;
  content: string;
  id: string; // For stable keys and reordering
}

// Define base theme colors for dynamic assignment
const THEME_COLORS = [
  {
    gradient: 'from-primary/10 to-primary-focus/10',
    bgGradient: 'bg-gradient-to-r from-primary/5 via-primary-focus/5 to-primary/5',
    accentColor: 'text-primary-focus',
    borderColor: 'border-primary/20',
    bgColor: 'bg-primary',
    textColor: 'text-primary-content'
  },
  {
    gradient: 'from-secondary/10 to-secondary-focus/10',
    bgGradient: 'bg-gradient-to-r from-secondary/5 via-secondary-focus/5 to-secondary/5',
    accentColor: 'text-secondary-focus',
    borderColor: 'border-secondary/20',
    bgColor: 'bg-secondary',
    textColor: 'text-secondary-content'
  },
  {
    gradient: 'from-accent/10 to-accent-focus/10',
    bgGradient: 'bg-gradient-to-r from-accent/5 via-accent-focus/5 to-accent/5',
    accentColor: 'text-accent-focus',
    borderColor: 'border-accent/20',
    bgColor: 'bg-accent',
    textColor: 'text-accent-content'
  },
  {
    gradient: 'from-info/10 to-info-focus/10',
    bgGradient: 'bg-gradient-to-r from-info/5 via-info-focus/5 to-info/5',
    accentColor: 'text-info-focus',
    borderColor: 'border-info/20',
    bgColor: 'bg-info',
    textColor: 'text-info-content'
  },
  {
    gradient: 'from-success/10 to-success-focus/10',
    bgGradient: 'bg-gradient-to-r from-success/5 via-success-focus/5 to-success/5',
    accentColor: 'text-success-focus',
    borderColor: 'border-success/20',
    bgColor: 'bg-success',
    textColor: 'text-success-content'
  }
];

const DEFAULT_THEME = {
  gradient: 'from-neutral-500/10 to-neutral-600/10',
  bgGradient: 'bg-gradient-to-r from-neutral-500/5 via-neutral-400/5 to-neutral-500/5',
  accentColor: 'text-neutral-600',
  borderColor: 'border-neutral-200',
  bgColor: 'bg-neutral-focus',
  textColor: 'text-neutral-content'
};

interface SpeakerTheme {
  gradient: string;
  icon: JSX.Element;
  accentColor: string;
  bgGradient: string;
  borderColor: string;
}

interface TranscriptEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  isLoading: boolean;
  characters: string[];
}

const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  initialContent,
  onSave,
  isLoading,
  characters
}) => {
  const [turns, setTurns] = useState<DialogTurn[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState<number | null>(null);

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

  // Parse initial content into turns
  useEffect(() => {
    const parsedTurns = parseTranscript(initialContent);
    setTurns(parsedTurns);
  }, [initialContent]);

  // Parse transcript text into turns
  const parseTranscript = (text: string): DialogTurn[] => {
    // Split by newlines and look for "Speaker:" pattern
    return text.split('\n')
      .reduce<DialogTurn[]>((acc, line) => {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          acc.push({
            speaker: match[1].trim(),
            content: match[2].trim(),
            id: crypto.randomUUID()
          });
        } else if (line.trim() && acc.length > 0) {
          // Append to last turn if it's a continuation
          acc[acc.length - 1].content += ' ' + line.trim();
        }
        return acc;
      }, []);
  };

  // Convert turns back to text format
  const turnsToText = (dialogTurns: DialogTurn[]): string => {
    return dialogTurns.map(turn => `${turn.speaker}: ${turn.content}`).join('\n');
  };

  const handleTurnUpdate = (index: number, updatedTurn: Partial<DialogTurn>) => {
    const newTurns = [...turns];
    newTurns[index] = { ...newTurns[index], ...updatedTurn };
    setTurns(newTurns);
    setIsDirty(true);
  };

  const handleAddTurn = (index: number) => {
    const newTurns = [...turns];
    newTurns.splice(index + 1, 0, { speaker: '', content: '', id: crypto.randomUUID() });
    setTurns(newTurns);
    setSelectedTurnIndex(index + 1);
    setIsDirty(true);
  };

  const handleDeleteTurn = (index: number) => {
    const newTurns = turns.filter((_, i) => i !== index);
    setTurns(newTurns);
    setSelectedTurnIndex(null);
    setIsDirty(true);
  };

  const handleMoveTurn = (fromIndex: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && fromIndex === 0) || 
        (direction === 'down' && fromIndex === turns.length - 1)) return;

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    const newTurns = [...turns];
    const [movedTurn] = newTurns.splice(fromIndex, 1);
    newTurns.splice(toIndex, 0, movedTurn);
    setTurns(newTurns);
    setSelectedTurnIndex(toIndex);
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(turnsToText(turns));
  };

  const handleReset = () => {
    const parsedTurns = parseTranscript(initialContent);
    setTurns(parsedTurns);
    setSelectedTurnIndex(null);
    setIsDirty(false);
  };

  return (
    <div className="card bg-base-100 shadow-xl overflow-hidden">
      <div className="card-body p-0">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 border-b border-base-200">
          <h2 className="card-title text-2xl flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </span>
            Dialogue Editor
            {isDirty && (
              <span className="text-warning text-sm font-normal flex items-center gap-1 ml-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Unsaved changes
              </span>
            )}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            {turns.map((turn, index) => {
              const theme = getSpeakerTheme(turn.speaker);
              return (
                <div 
                  key={turn.id}
                  className={`group relative rounded-xl transition-all duration-200 ${
                    selectedTurnIndex === index 
                      ? `bg-gradient-to-r ${theme.gradient} shadow-lg ring-1 ring-${theme.accentColor}/20` 
                      : `hover:bg-gradient-to-r hover:${theme.gradient}`
                  } p-4`}
                >
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                    <button
                      type="button"
                      className="btn btn-circle btn-xs btn-ghost bg-base-100 shadow-sm"
                      onClick={() => handleMoveTurn(index, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn btn-circle btn-xs btn-ghost bg-base-100 shadow-sm"
                      onClick={() => handleMoveTurn(index, 'down')}
                      disabled={index === turns.length - 1}
                      title="Move down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-4" onClick={() => setSelectedTurnIndex(index)}>
                    <div className="flex gap-4">
                      <div className="w-1/4">
                        <div className="relative dropdown w-full">
                          <div className={`relative flex items-center ${theme.bgGradient} rounded-lg border ${theme.borderColor}`}>
                            <div className="absolute left-3">
                              {theme.icon}
                            </div>
                            <select
                              className={`select w-full pl-14 pr-10 bg-transparent border-none ${theme.accentColor} font-medium`}
                              value={turn.speaker}
                              onChange={(e) => handleTurnUpdate(index, { speaker: e.target.value })}
                            >
                              <option value="" disabled>Choose speaker...</option>
                              {characters.map(character => (
                                <option 
                                  key={character} 
                                  value={character}
                                  className="py-2"
                                >
                                  {character}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className={`relative group ${theme.bgGradient} rounded-lg border ${theme.borderColor}`}>
                          <textarea
                            className={`textarea w-full min-h-[60px] bg-transparent border-none ${theme.accentColor} placeholder-base-content/30`}
                            value={turn.content}
                            onChange={(e) => handleTurnUpdate(index, { content: e.target.value })}
                            placeholder="Enter dialogue..."
                          />
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className={`badge badge-sm ${theme.accentColor} bg-base-100/50`}>
                              Press Enter for new line
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                    <button
                      type="button"
                      className={`btn btn-circle btn-sm ${theme.accentColor} bg-base-100/80 hover:${theme.bgGradient} border-none shadow-lg`}
                      onClick={() => handleAddTurn(index)}
                      title="Add turn after"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn btn-circle btn-sm text-error bg-base-100/80 hover:bg-error/10 border-none shadow-lg"
                      onClick={() => handleDeleteTurn(index)}
                      title="Delete turn"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              className="btn btn-ghost gap-2 normal-case hover:bg-base-200/50 border border-base-300/50 shadow-sm"
              onClick={() => handleAddTurn(turns.length - 1)}
            >
              <div className="avatar placeholder">
                <div className="bg-primary/10 text-primary rounded-full w-6 h-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              Add New Turn
            </button>
          </div>

          <div className="card-actions justify-end space-x-4 pt-6 border-t border-base-200">
            <button
              type="button"
              className="btn btn-ghost gap-2 normal-case hover:bg-base-200/50"
              onClick={handleReset}
              disabled={!isDirty || isLoading}
            >
              <div className="avatar placeholder">
                <div className="bg-base-300/50 text-base-content/70 rounded-full w-6 h-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              Reset Changes
            </button>
            {isDirty ? (
              <button
                type="submit"
                className={`btn btn-primary gap-2 min-w-[200px] normal-case ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {!isLoading && (
                  <div className="avatar placeholder">
                    <div className="bg-primary-content/20 text-primary-content rounded-full w-6 h-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary gap-2 min-w-[200px] normal-case"
                disabled={isLoading}
              >
                <div className="avatar placeholder">
                  <div className="bg-primary-content/20 text-primary-content rounded-full w-6 h-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                Continue
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TranscriptEditor;