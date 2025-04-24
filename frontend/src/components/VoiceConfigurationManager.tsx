import React, { useState, useEffect, useMemo } from 'react';
import { VoiceConfig } from '../types/voice';
import { ProgressUpdate } from '../types/audio';
import SpeakerConfigForm from './SpeakerConfigForm';
import AudioGenerationProgress from './AudioGenerationProgress';
import TranscriptEditor from './TranscriptEditor';
import { SpeakerVoiceMapping } from '../types/speaker';
import { useAudio } from '../contexts/AudioContext';
import { DialogTurn, parseTranscript, turnsToText } from '../utils/transcriptUtils';

interface VoiceConfigurationManagerProps {
  speaker: string;
  initialTranscript?: string;
  onComplete: (audioUrl: string) => void;
  onTranscriptChange?: (transcript: string) => void;
  apiBaseUrl?: string;
  targetDurationMinutes?: number | null;
  onFinalizeTurns?: (turns: DialogTurn[]) => void;
}

const VoiceConfigurationManager: React.FC<VoiceConfigurationManagerProps> = ({
  speaker,
  initialTranscript = '',
  onComplete,
  onTranscriptChange,
  apiBaseUrl = '',
  targetDurationMinutes = null,
  onFinalizeTurns
}) => {
  console.log('VoiceConfigurationManager received initialTranscript:', initialTranscript);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [voiceMappings, setVoiceMappings] = useState<Record<string, SpeakerVoiceMapping>>({});
  const [configCompleted, setConfigCompleted] = useState(false);
  const [turns, setTurns] = useState<DialogTurn[]>([]);
  const [isTranscriptDirty, setIsTranscriptDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    generateSegmentAudio, 
    isGeneratingSegment, 
    segmentError 
  } = useAudio();

  useEffect(() => {
    const parsedTurns = parseTranscript(initialTranscript);
    setTurns(parsedTurns);
    setIsTranscriptDirty(false);
  }, [initialTranscript]);

  useEffect(() => {
    if (segmentError) {
      setError(segmentError);
    }
  }, [segmentError]);

  const handleTurnUpdate = (index: number, updatedTurnData: Partial<DialogTurn>) => {
    setTurns(prevTurns => {
      const newTurns = [...prevTurns];
      newTurns[index] = { ...newTurns[index], ...updatedTurnData };
      return newTurns;
    });
    setIsTranscriptDirty(true);
  };

  const handleAddTurn = (index: number, speakerToAdd?: string) => {
    setTurns(prevTurns => {
      const newTurns = [...prevTurns];
      const defaultSpeaker = speakerToAdd || speaker || '';
      newTurns.splice(index + 1, 0, {
        speaker: defaultSpeaker,
        content: '',
        id: crypto.randomUUID(),
        audioUrl: undefined
      });
      return newTurns;
    });
    setIsTranscriptDirty(true);
  };

  const handleDeleteTurn = (index: number) => {
    setTurns(prevTurns => prevTurns.filter((_, i) => i !== index));
    setIsTranscriptDirty(true);
  };

  const handleMoveTurn = (fromIndex: number, direction: 'up' | 'down') => {
    setTurns(prevTurns => {
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= prevTurns.length) return prevTurns;

      const newTurns = [...prevTurns];
      const [movedTurn] = newTurns.splice(fromIndex, 1);
      newTurns.splice(toIndex, 0, movedTurn);
      return newTurns;
    });
    setIsTranscriptDirty(true);
  };

  const handleSaveFromEditor = () => {
    setIsTranscriptDirty(false);
    if (onTranscriptChange) {
      onTranscriptChange(turnsToText(turns));
    }
    console.log("Transcript state saved (dirty flag reset)");
  };

  const addUpdate = (
    stage: string, 
    percentage: number = 0, 
    type: 'progress' | 'error' | 'segment_complete' | 'complete' = 'progress'
  ) => {
    setUpdates(prev => [...prev, {
      stage,
      progress: {
        current: percentage,
        total: 100,
        percentage
      },
      timestamp: Date.now(),
      type
    } as ProgressUpdate]);
  };

  const handleVoiceConfigSubmit = async (mappings: Record<string, SpeakerVoiceMapping>) => {
    try {
      setIsGenerating(true);
      setUpdates([]);
      setError(null);

      addUpdate('Initializing voice configuration...', 0);
      await new Promise(resolve => setTimeout(resolve, 1000));

      addUpdate('Processing voice configurations...', 50);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setVoiceMappings(mappings);
      setConfigCompleted(true);
      
      addUpdate('Voice configuration complete!', 100, 'complete');
      
      if (!onTranscriptChange) {
        onComplete('https://example.com/generated-audio.mp3');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      addUpdate(`Error: ${errorMessage}`, 0, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSegmentAudio = async (
    index: number,
    speakerName: string, 
    text: string
  ): Promise<void> => {
    try {
      setError(null);
      
      if (!voiceMappings[speakerName]) {
        throw new Error(`No voice configuration found for speaker: ${speakerName}`);
      }
      
      await generateSegmentAudio(speakerName, text, voiceMappings);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const { wordCount, estimatedDurationMinutes } = useMemo(() => {
    const text = turnsToText(turns);
    const words = text.match(/\b\w+\b/g)?.length ?? 0;
    const WPM = 150;
    const duration = words > 0 ? Math.ceil(words / WPM) : 0;
    return { wordCount: words, estimatedDurationMinutes: duration };
  }, [turns]);

  const handleFinalComplete = () => {
    if (isTranscriptDirty) {
      console.warn("Completing with unsaved changes in the transcript editor.");
    }
    if (onFinalizeTurns) {
      onFinalizeTurns(turns);
    }
    onComplete('https://example.com/final-audio.mp3');
  };

  // Derive unique characters from the parsed turns
  const characters = useMemo(() => {
    if (!turns || turns.length === 0) {
      // Fallback if turns are empty - maybe use the initial speaker prop?
      // Or return empty array if transcript is the sole source of truth.
      return speaker ? [speaker] : []; 
    }
    const uniqueSpeakers = new Set(turns.map(turn => turn.speaker));
    return Array.from(uniqueSpeakers);
  }, [turns, speaker]); // Include speaker as dependency for the fallback

  return (
    <div className="voice-config-manager p-4 md:p-6 space-y-8">
      {/* --- Main Error Display --- */}
      {error && (
        <div className="alert alert-error shadow-lg">
          <div className="flex-1 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button 
            className="btn btn-sm btn-ghost" 
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* --- Stage 1: Voice Configuration --- */}
      <div className={`card bg-base-100 shadow-xl border border-base-300/50 ${configCompleted ? 'opacity-60 pointer-events-none' : ''}`}> 
        <div className="card-body p-6">
          <h2 className="card-title text-xl font-semibold text-base-content flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${configCompleted ? 'bg-success/20' : 'bg-primary/15'} border ${configCompleted ? 'border-success/30' : 'border-primary/20'}`}>
              {configCompleted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="font-bold text-primary">1</span>
              )}
            </span>
            Configure Character Voices
          </h2>
          
          {!configCompleted ? (
            <SpeakerConfigForm
              characters={characters}
              onSubmit={handleVoiceConfigSubmit}
              isLoading={isGenerating}
            />
          ) : (
            <div className="text-center py-4 text-success/80">
              Voice configurations applied successfully.
            </div>
          )}
        </div>
      </div>

      {/* --- Stage 2: Transcript Editing & Audio Generation --- */}
      {configCompleted && (
        <div className="card bg-base-100 shadow-xl border border-base-300/50">
          <div className="card-body p-0"> {/* Remove padding here, let TranscriptEditor handle its own */}
            <div className="p-6 pb-0"> {/* Add padding for the header */} 
              <h2 className="card-title text-xl font-semibold text-base-content flex items-center gap-3 mb-0">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 border border-primary/20">
                  <span className="font-bold text-primary">2</span>
                </span>
                Edit Transcript & Generate Audio
              </h2>
            </div>
            
            <TranscriptEditor
              turns={turns}
              onTurnUpdate={handleTurnUpdate}
              onAddTurn={handleAddTurn}
              onDeleteTurn={handleDeleteTurn}
              onMoveTurn={handleMoveTurn}
              onSave={handleSaveFromEditor}
              isDirty={isTranscriptDirty}
              isLoading={isGenerating || isGeneratingSegment}
              characters={characters}
              voiceMappings={voiceMappings}
              onGenerateSegmentAudio={handleGenerateSegmentAudio}
              wordCount={wordCount}
              estimatedDurationMinutes={estimatedDurationMinutes}
              targetDurationMinutes={targetDurationMinutes}
              // onExtendTranscript={handleExtendTranscript} // Add if extension logic is implemented
              // isExtending={isExtending} // Add if extension logic is implemented
            />

            {/* --- Final Completion Button --- */} 
            <div className="p-6 pt-0 flex justify-end border-t border-base-300/50 mt-4">
              <button 
                className="btn btn-success btn-md gap-2 shadow-md hover:shadow-lg transition-shadow duration-300"
                onClick={handleFinalComplete}
                // TODO: Add better disabled logic (e.g., check if all segments have audio?)
                disabled={isGenerating || isGeneratingSegment || isTranscriptDirty}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Finalize & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceConfigurationManager;
