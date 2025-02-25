import React, { useState, useEffect } from 'react';
import ConceptForm from './components/ConceptForm';
import TranscriptEditor from './components/TranscriptEditor';
import SpeakerConfigForm from './components/SpeakerConfigForm';
import ProgressSteps from './components/ProgressSteps';
import { SpeakerVoiceMapping } from './types/speaker';
import wsService from './services/websocket';
import { VOICE_CONFIGS, VOICE_OPTIONS } from './config/voices';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [characters, setCharacters] = useState<string[]>([]);
  const [voiceMappings, setVoiceMappings] = useState<Record<string, SpeakerVoiceMapping>>({});
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const STEPS = [
    { label: 'Concept', desc: 'Define your podcast' },
    { label: 'Transcript', desc: 'Edit content' },
    { label: 'Voices', desc: 'Configure voices' },
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
    const handleTranscriptGenerated = (transcriptData: string) => {
      setTranscript(transcriptData);
      setStep(2); // Now moves to Transcript step instead of Voices
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
  }, []);

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
      setStep(4); // Changed from 3 to 4 since we moved steps
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
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to save transcript');
      }
      
      setTranscript(editedTranscript);
      setStep(3); // Changed from 4 to 3 since we moved steps
    } catch (error) {
      console.error('Error saving transcript:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioGeneration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Format the request data
      const requestData = {
        transcript: transcript,
        voiceMappings: voiceMappings
      };

      console.log('Sending request:', requestData);  // Add this log

      const response = await fetch(`${API_BASE_URL}/api/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate audio');
      }
      
      const data = await response.json();
      setAudioUrl(`${API_BASE_URL}${data.audioUrl}`);
    } catch (error) {
      console.error('Error generating audio:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-300 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-conic from-primary via-secondary to-accent blur-3xl transform rotate-45"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-conic from-accent via-primary to-secondary blur-3xl transform -rotate-45"></div>
      </div>

      <div className="max-w-5xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-block">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient-x mb-6 tracking-tight">
              Podcast Generator
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full"></div>
          </div>
          <p className="text-xl text-base-content/70 mt-6 font-light">
            Create professional podcasts with AI-powered voices
          </p>
        </div>
        
        {/* Progress Steps */}
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

          <div className={`transition-all duration-500 ${isLoading ? 'opacity-50 scale-98' : 'scale-100'}`}>
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
                <TranscriptEditor
                  initialContent={transcript}
                  onSave={handleTranscriptSave}
                  isLoading={isLoading}
                  characters={characters}
                />
              </div>
            )}

            {step === 3 && (
              <div className="animate-fadeIn">
                <SpeakerConfigForm
                  characters={characters}
                  onSubmit={handleVoiceConfigSubmit}
                  isLoading={isLoading}
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

export default App;