import React, { useState } from 'react';
import { VoiceConfig } from '../types/voice';
import { ProgressUpdate } from '../types/audio';
import SpeakerConfigForm from './SpeakerConfigForm';
import AudioGenerationProgress from './AudioGenerationProgress';

interface VoiceConfigurationManagerProps {
  speaker: string;
  onComplete: (audioUrl: string) => void;
}

const VoiceConfigurationManager: React.FC<VoiceConfigurationManagerProps> = ({
  speaker,
  onComplete
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);

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

  const handleVoiceConfigSubmit = async (voiceMappings: Record<string, VoiceConfig>) => {
    try {
      setIsGenerating(true);
      setUpdates([]);

      // Add progress updates
      addUpdate('Initializing audio generation...', 0);
      await new Promise(resolve => setTimeout(resolve, 1000));

      addUpdate('Processing voice configurations...', 33);
      await new Promise(resolve => setTimeout(resolve, 1500));

      addUpdate('Generating audio...', 66);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate audio URL generation
      const audioUrl = 'https://example.com/generated-audio.mp3';
      
      addUpdate('Audio generation complete!', 100, 'complete');
      onComplete(audioUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      addUpdate(`Error: ${errorMessage}`, 0, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Configuration Form */}
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

      {/* Generation Progress */}
      {(updates.length > 0 || isGenerating) && (
        <AudioGenerationProgress
          updates={updates}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
};

export default VoiceConfigurationManager;
