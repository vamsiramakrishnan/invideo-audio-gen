import React, { useState, useEffect } from 'react';
import wsService from './services/websocket';
import ConceptForm from './components/ConceptForm';
import SpeakerConfigForm from './components/SpeakerConfigForm';
import TranscriptEditor from './components/TranscriptEditor';
import ProgressSteps from './components/ProgressSteps';
import { SpeakerVoiceMapping } from './types/speaker';
import { usePodcast } from './contexts/PodcastContext';
import { useAudio } from './contexts/AudioContext';
import { AudioProvider } from './contexts/AudioContext';

// Define API_BASE_URL since it's not found in a config file
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Define the structure of the transcript response
interface TranscriptResponse {
  transcript: string;
  word_count: number;
  estimated_duration_minutes: number;
  success?: boolean;
  detail?: string;
  characters?: string[];
}

const AppContent = () => {
  // Use the PodcastContext for global state
  const { 
    step, 
    setStep,
    transcript, 
    setTranscript,
    characters, 
    setCharacters,
    voiceMappings, 
    setVoiceMappings,
    error, 
    setError,
    isLoading, 
    setIsLoading,
    setWordCount,
    setEstimatedDurationMinutes,
    wordCount,
    estimatedDurationMinutes,
  } = usePodcast();
  
  // Use the AudioContext for audio generation
  const {
    generateAudio,
    isGenerating,
    isGeneratingSegment,
    segmentError,
    audioUrl
  } = useAudio();

  // Add state for target duration and extending status
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number | null>(null);
  const [isExtending, setIsExtending] = useState(false); 

  const STEPS = [
    { label: 'Concept', desc: 'Define your podcast' },
    { label: 'Voices', desc: 'Configure voices' },
    { label: 'Transcript', desc: 'Edit content' },
    { label: 'Audio', desc: 'Listen & export' }
  ];

  const handleStepChange = (newStep: number) => {
    // Only allow moving to steps that have been unlocked
    if (newStep <= step) {
      setStep(newStep);
    }
  };

  useEffect(() => {
    // Set up WebSocket listeners
    const handleTranscriptGenerated = (data: TranscriptResponse) => {
      setTranscript(data.transcript);
      setWordCount(data.word_count);
      setEstimatedDurationMinutes(data.estimated_duration_minutes);
      setStep(2); // Move to Voices step
      setIsLoading(false);
    };

    const handleError = (errorMessage: string) => {
      console.error('WebSocket error:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    };

    wsService.on('transcript_generated', handleTranscriptGenerated);
    wsService.on('error', handleError);

    return () => {
      wsService.off('transcript_generated', handleTranscriptGenerated);
      wsService.off('error', handleError);
    };
  }, [setTranscript, setStep, setIsLoading, setError, setWordCount, setEstimatedDurationMinutes]);

  // If there's a segment audio error, update the global error state
  useEffect(() => {
    if (segmentError) {
      setError(segmentError);
    }
  }, [segmentError, setError]);

  const handleConceptSubmit = async (concept: {
    topic: string;
    num_speakers: number;
    character_names: string[];
    expertise_level: string;
    duration_minutes: number;
    format_style: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      setCharacters(concept.character_names);
      wsService.generateTranscript(concept);
      // Store the target duration from the concept
      setTargetDurationMinutes(concept.duration_minutes);
    } catch (error) {
      console.error('Error generating transcript:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleVoiceConfigSubmit = async (mappings: Record<string, SpeakerVoiceMapping>) => {
    try {
      setIsLoading(true);
      setVoiceMappings(mappings);
      setStep(3); // Move to Transcript step after voice configuration
    } catch (error) {
      console.error('Error configuring voices:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscriptSave = async (editedTranscript: string) => {
    try {
      setIsLoading(true);
      // Save transcript logic here
      if (!editedTranscript.trim()) {
        throw new Error('Transcript cannot be empty');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/edit-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: editedTranscript }),
      });
      
      const data: TranscriptResponse & { success: boolean, characters: string[], detail?: string } = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.detail || (response.statusText || 'Failed to save transcript'));
      }
      
      setTranscript(editedTranscript);
      setCharacters(data.characters);
      setWordCount(data.word_count);
      setEstimatedDurationMinutes(data.estimated_duration_minutes);
      setStep(4); // Move to Audio step after transcript editing
    } catch (error) {
      console.error('Error saving transcript:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to handle transcript extension
  const handleExtendTranscript = async (currentTranscript: string): Promise<string> => {
    if (!targetDurationMinutes) {
      throw new Error("Target duration is not set.");
    }
    setIsExtending(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/extend-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: currentTranscript,
          target_duration_minutes: targetDurationMinutes,
          characters: characters 
        }),
      });

      const data: TranscriptResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.detail || 'Failed to extend transcript');
      }

      // Update state with the full extended transcript and new metrics
      setTranscript(data.transcript);
      setWordCount(data.word_count);
      setEstimatedDurationMinutes(data.estimated_duration_minutes);

      return data.transcript; // Return the extended transcript string
    } catch (err) {
      console.error('Error extending transcript:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during extension';
      setError(errorMessage);
      throw err; // Re-throw so TranscriptEditor can potentially handle it
    } finally {
      setIsExtending(false);
    }
  };

  const handleAudioGeneration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await generateAudio({
        transcript,
        voiceMappings
      });
      
      setStep(5); // Move to final step with audio player
    } catch (error) {
      console.error('Error generating audio:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-300">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          AI Podcast Generator
        </h1>

        <ProgressSteps
          currentStep={step}
          onStepClick={handleStepChange}
          steps={STEPS}
        />

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="alert alert-error shadow-xl mb-8 animate-slideDown backdrop-blur-lg bg-error/80">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className={`transition-all duration-500 ${isLoading || isGenerating || isGeneratingSegment ? 'opacity-50 scale-98' : 'scale-100'}`}>
            {step === 1 && (
              <div className="animate-fadeIn">
                <ConceptForm
                  onSubmit={handleConceptSubmit}
                  isLoading={isLoading}
                />
              </div>
            )}

            {step === 2 && (
              <div className="animate-fadeIn">
                <SpeakerConfigForm
                  characters={characters}
                  onSubmit={handleVoiceConfigSubmit}
                  isLoading={isLoading}
                />
              </div>
            )}

            {step === 3 && (
              <div className="animate-fadeIn">
                <TranscriptEditor
                  initialContent={transcript}
                  onSave={handleTranscriptSave}
                  isLoading={isLoading}
                  characters={characters}
                  voiceMappings={voiceMappings}
                  wordCount={wordCount}
                  estimatedDurationMinutes={estimatedDurationMinutes}
                  targetDurationMinutes={targetDurationMinutes}
                  onExtendTranscript={handleExtendTranscript}
                  isExtending={isExtending}
                />
              </div>
            )}

            {step === 4 && (
              <div className="animate-fadeIn">
                <button
                  className="btn btn-primary btn-lg gap-3 px-8 font-medium tracking-wide"
                  onClick={handleAudioGeneration}
                >
                  Generate Audio
                </button>
              </div>
            )}

            {step === 5 && audioUrl && (
              <div className="card bg-base-100/50 shadow-2xl backdrop-blur-lg animate-fadeIn border border-base-content/5">
                <div className="card-body">
                  <h2 className="card-title text-3xl mb-8 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Your Generated Podcast
                  </h2>
                  <div className="bg-base-200/50 backdrop-blur rounded-xl p-8 border border-base-content/5">
                    <audio
                      controls
                      className="w-full"
                      src={audioUrl}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                  <div className="card-actions justify-end mt-8">
                    <button
                      className="btn btn-primary btn-lg gap-3 px-8 font-medium tracking-wide"
                      onClick={() => setStep(1)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      </svg>
                      Create New Podcast
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AudioProvider apiBaseUrl={API_BASE_URL}>
      <AppContent />
    </AudioProvider>
  );
};

export default App;