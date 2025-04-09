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

  const handleGenerateSegmentAudio = async (speakerName: string, text: string): Promise<string> => {
    try {
      setError(null);
      
      if (!voiceMappings[speakerName]) {
        throw new Error(`No voice configuration found for speaker: ${speakerName}`);
      }
      
      const audioUrl = await generateSegmentAudio(speakerName, text, voiceMappings);
      return audioUrl;
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="alert alert-error shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button 
            className="btn btn-sm btn-ghost" 
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {!configCompleted && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl flex items-center gap-3">
              <span className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </span>
              Configure Voice
            </h2>
            
            <SpeakerConfigForm
              characters={[speaker]}
              onSubmit={handleVoiceConfigSubmit}
              isLoading={isGenerating}
            />
          </div>
        </div>
      )}

      {configCompleted && (
        <div className="mt-8">
          <TranscriptEditor
            turns={turns}
            onSave={handleSaveFromEditor}
            isLoading={isGenerating || isGeneratingSegment}
            characters={[speaker]}
            voiceMappings={voiceMappings}
            onGenerateSegmentAudio={handleGenerateSegmentAudio}
            wordCount={wordCount}
            estimatedDurationMinutes={estimatedDurationMinutes}
            targetDurationMinutes={targetDurationMinutes}
            onTurnUpdate={handleTurnUpdate}
            onAddTurn={handleAddTurn}
            onDeleteTurn={handleDeleteTurn}
            onMoveTurn={handleMoveTurn}
            isDirty={isTranscriptDirty}
          />
          
          <div className="mt-6 flex justify-end">
            <button
              className="btn btn-primary gap-2"
              onClick={handleFinalComplete}
              disabled={isGenerating || isGeneratingSegment}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Complete
            </button>
          </div>
        </div>
      )}

      {(updates.length > 0 || isGenerating || isGeneratingSegment) && (
        <AudioGenerationProgress
          updates={updates}
          isGenerating={isGenerating || isGeneratingSegment}
        />
      )}
    </div>
  );
};

export default VoiceConfigurationManager;
