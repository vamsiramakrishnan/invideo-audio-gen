import React from 'react';
import { GenerationRequest } from '../types/audio';
import { useAudioGeneration } from '../hooks/useAudioGeneration';
import AudioGenerationProgress from './AudioGenerationProgress';

interface AudioGenerationSectionProps {
  transcript: string;
  voiceMappings: Record<string, any>;
}

const AudioGenerationSection: React.FC<AudioGenerationSectionProps> = ({
  transcript,
  voiceMappings
}) => {
  const {
    generateAudio,
    isGenerating,
    updates,
    hasError,
    isComplete
  } = useAudioGeneration();

  const handleGenerate = async () => {
    await generateAudio({ transcript, voiceMappings });
  };

  return (
    <div className="space-y-6">
      {/* Generation Button */}
      <div className="flex justify-end">
        <button
          className={`
            btn btn-primary
            ${isGenerating ? 'loading' : ''}
          `}
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Audio'}
        </button>
      </div>

      {/* Progress Display */}
      {(updates.length > 0 || isGenerating) && (
        <AudioGenerationProgress
          updates={updates}
          isGenerating={isGenerating}
        />
      )}

      {/* Download Section */}
      {isComplete && !hasError && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl flex items-center gap-2">
              <span className="p-2 bg-gradient-to-br from-success/20 to-success/10 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </span>
              Download Audio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {updates
                .filter(update => update.type === 'segment_complete')
                .map((segment, index) => (
                  <a
                    key={segment.segment_path}
                    href={segment.segment_path}
                    download
                    className="btn btn-outline gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download {segment.speaker}'s Audio
                  </a>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioGenerationSection;
