import React, { useState, useEffect } from 'react';
import { VoiceConfig } from '../types/voice';
import { ProgressUpdate } from '../types/audio';
import SpeakerConfigForm from './SpeakerConfigForm';
import AudioGenerationProgress from './AudioGenerationProgress';
import TranscriptEditor from './TranscriptEditor';
import { SpeakerVoiceMapping } from '../types/speaker';
import { useAudio } from '../contexts/AudioContext';

interface VoiceConfigurationManagerProps {
  speaker: string;
  initialTranscript?: string;
  onComplete: (audioUrl: string) => void;
  onTranscriptChange?: (transcript: string) => void;
  apiBaseUrl?: string;
}

const VoiceConfigurationManager: React.FC<VoiceConfigurationManagerProps> = ({
  speaker,
  initialTranscript = '',
  onComplete,
  onTranscriptChange,
  apiBaseUrl = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [voiceMappings, setVoiceMappings] = useState<Record<string, SpeakerVoiceMapping>>({});
  const [configCompleted, setConfigCompleted] = useState(false);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [error, setError] = useState<string | null>(null);
  
  // Use the AudioContext for audio generation
  const { 
    generateSegmentAudio, 
    isGeneratingSegment, 
    segmentError 
  } = useAudio();

  // Effect to handle segment errors
  useEffect(() => {
    if (segmentError) {
      setError(segmentError);
    }
  }, [segmentError]);

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

      // Add progress updates
      addUpdate('Initializing voice configuration...', 0);
      await new Promise(resolve => setTimeout(resolve, 1000));

      addUpdate('Processing voice configurations...', 50);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Store voice mappings for later use
      setVoiceMappings(mappings);
      setConfigCompleted(true);
      
      addUpdate('Voice configuration complete!', 100, 'complete');
      
      // If there's no transcript editor functionality, complete immediately
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

  const handleTranscriptSave = (newTranscript: string) => {
    setTranscript(newTranscript);
    if (onTranscriptChange) {
      onTranscriptChange(newTranscript);
    }
  };

  // Function to generate audio for a specific segment
  const handleGenerateSegmentAudio = async (speaker: string, text: string): Promise<string> => {
    try {
      setError(null);
      
      if (!voiceMappings[speaker]) {
        throw new Error(`No voice configuration found for speaker: ${speaker}`);
      }
      
      // Use the AudioContext to generate segment audio
      const audioUrl = await generateSegmentAudio(speaker, text, voiceMappings);
      return audioUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error display */}
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

      {/* Voice Configuration Form */}
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

      {/* Transcript Editor (shown after voice configuration) */}
      {configCompleted && onTranscriptChange && (
        <div className="mt-8">
          <TranscriptEditor
            initialContent={transcript}
            onSave={handleTranscriptSave}
            isLoading={isGenerating || isGeneratingSegment}
            characters={[speaker]}
            voiceMappings={voiceMappings}
            onGenerateSegmentAudio={handleGenerateSegmentAudio}
          />
          
          <div className="mt-6 flex justify-end">
            <button
              className="btn btn-primary gap-2"
              onClick={() => onComplete('https://example.com/final-audio.mp3')}
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

      {/* Generation Progress */}
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
