import React, { useState, useEffect, useMemo } from 'react';
import wsService from './services/websocket';
import ConceptForm from './components/ConceptForm';
import SpeakerConfigForm from './components/SpeakerConfigForm';
import TranscriptEditor from './components/TranscriptEditor';
import ProgressSteps from './components/ProgressSteps';
import { SpeakerVoiceMapping } from './types/speaker';
import { usePodcast } from './contexts/PodcastContext';
import { useAudio } from './contexts/AudioContext';
import { AudioProvider } from './contexts/AudioContext';
import { DialogTurn, parseTranscript, turnsToText } from './utils/transcriptUtils';

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
    transcript: transcriptStringFromContext, 
    setTranscript: setTranscriptStringInContext,
    characters, 
    setCharacters,
    voiceMappings, 
    setVoiceMappings,
    error, 
    setError,
    isLoading, 
    setIsLoading,
  } = usePodcast();
  
  // Use the AudioContext for audio generation
  const {
    generateAudio,
    isGenerating,
    isGeneratingSegment,
    segmentError,
    audioUrl,
    generateSegmentAudio 
  } = useAudio();

  // Add state for target duration and extending status
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number | null>(null);
  const [isExtending, setIsExtending] = useState(false); 

  // --- Add State for Transcript Editor ---
  const [turns, setTurns] = useState<DialogTurn[]>([]);
  const [isTranscriptDirty, setIsTranscriptDirty] = useState(false);
  // --- End State --- 

  const STEPS = [
    { label: 'Concept', desc: 'Define your podcast' },
    { label: 'Voices', desc: 'Configure voices' },
    { label: 'Transcript', desc: 'Edit content' },
    { label: 'Audio', desc: 'Listen & export' }
  ];

  const handleStepChange = (newStep: number) => {
    // Only allow moving to steps that have been unlocked
    if (newStep <= step) {
      // Add check for unsaved changes when leaving step 3
      if (step === 3 && isTranscriptDirty && newStep !== 3) {
        if (!window.confirm("You have unsaved changes in the transcript. Are you sure you want to leave?")) {
          return; // Stay on the current step
        }
        // If user confirms, reset dirty state (changes are discarded)
        setIsTranscriptDirty(false); 
      }
      setStep(newStep);
    }
  };

  // Effect to initialize/update local turns state when context transcript changes
  useEffect(() => {
    const parsedTurns = parseTranscript(transcriptStringFromContext);
    // Only update if the parsed turns are different from the current state
    // This prevents unnecessary resets when context updates but content is the same
    if (turnsToText(parsedTurns) !== turnsToText(turns)) {
      setTurns(parsedTurns);
      setIsTranscriptDirty(false); // Reset dirty state only when context causes a real change
    }
  }, [transcriptStringFromContext, turns]); // Add turns as dependency

  useEffect(() => {
    // Set up WebSocket listeners
    const handleTranscriptGenerated = (data: TranscriptResponse) => {
      // Update context string first
      setTranscriptStringInContext(data.transcript);
      // Context update will trigger the above useEffect to parse into local `turns` state
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
    // Removed setWordCount, setEstimatedDurationMinutes from dependencies
  }, [setTranscriptStringInContext, setStep, setIsLoading, setError]);

  // If there's a segment audio error, update the global error state
  useEffect(() => {
    if (segmentError) {
      setError(segmentError);
    }
  }, [segmentError, setError]);

  // Derive unique characters from the transcript string in the context
  const uniqueCharacters = useMemo(() => {
    if (!transcriptStringFromContext) {
      console.log("Memo: No transcript string, returning empty characters");
      return [];
    }
    console.log("Memo: Parsing transcript string for characters:", transcriptStringFromContext.substring(0, 50) + "..."); // Log first part
    const parsedTurns = parseTranscript(transcriptStringFromContext); // Use the utility function
    const speakers = new Set(parsedTurns.map(turn => turn.speaker));
    const characterArray = Array.from(speakers);
    console.log("Memo: Derived characters:", characterArray);
    return characterArray;
  }, [transcriptStringFromContext]); // Re-run only when the context string changes

  // --- Add Transcript Editor Handlers ---
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
      // Use provided speaker or first available character as default
      const defaultSpeaker = speakerToAdd || (characters.length > 0 ? characters[0] : '');
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
      if (toIndex < 0 || toIndex >= prevTurns.length) return prevTurns; // Boundary check

      const newTurns = [...prevTurns];
      const [movedTurn] = newTurns.splice(fromIndex, 1);
      newTurns.splice(toIndex, 0, movedTurn);
      return newTurns;
    });
    setIsTranscriptDirty(true);
  };
  // --- End Handlers ---

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
      setCharacters(concept.character_names || []); // Ensure characters is array
      wsService.generateTranscript(concept);
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

  // Update handleTranscriptSave to match new signature () => void
  const handleTranscriptSave = async () => { // No argument needed
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      
      // Get transcript string from current turns state
      const transcriptToSave = turnsToText(turns);
      
      if (!transcriptToSave.trim()) {
        throw new Error('Transcript cannot be empty');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/edit-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the generated string
        body: JSON.stringify({ transcript: transcriptToSave }),
      });
      
      const data: TranscriptResponse = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.detail || (response.statusText || 'Failed to save transcript'));
      }
      
      // Update context with the saved transcript string
      setTranscriptStringInContext(transcriptToSave);
      // Update characters if the backend potentially modified them (e.g., cleanup)
      if (data.characters) {
        setCharacters(data.characters);
      }
      // Local `turns` state is already up-to-date, word count/duration calculated below
      setIsTranscriptDirty(false); // Mark as saved
      setStep(4); // Move to Audio step after transcript editing
    } catch (error) {
      console.error('Error saving transcript:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleExtendTranscript to match new signature () => Promise<void>
  const handleExtendTranscript = async (): Promise<void> => { // No argument, returns void Promise
    if (!targetDurationMinutes) {
      // Maybe show user-friendly error instead of throwing?
      setError("Target duration is not set. Cannot extend.");
      return;
      // throw new Error("Target duration is not set.");
    }
    setIsExtending(true);
    setError(null);
    try {
      // Get current transcript from turns state
      const currentTranscriptText = turnsToText(turns);

      const response = await fetch(`${API_BASE_URL}/api/extend-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: currentTranscriptText,
          target_duration_minutes: targetDurationMinutes,
          characters: characters 
        }),
      });

      const data: TranscriptResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.detail || 'Failed to extend transcript');
      }

      // Update context string
      setTranscriptStringInContext(data.transcript);
      // Parse new transcript into local turns state (will trigger useEffect)
      const extendedTurns = parseTranscript(data.transcript);
      setTurns(extendedTurns);
      // Mark as dirty because content changed
      setIsTranscriptDirty(true); 
      // Word count/duration will update via useMemo
      // Function now implicitly returns Promise<void>
    } catch (err) {
      console.error('Error extending transcript:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during extension';
      setError(errorMessage);
      // No need to re-throw unless a downstream handler needs it
      // throw err;
    } finally {
      setIsExtending(false);
    }
  };

  // Calculate word count/duration from local `turns` state
  const { wordCount, estimatedDurationMinutes } = useMemo(() => {
    const text = turnsToText(turns);
    const words = text.match(/\b\w+\b/g)?.length ?? 0;
    const WPM = 150; // Words per minute
    const duration = words > 0 ? Math.ceil(words / WPM) : 0;
    // console.log("Recalculating stats:", { words, duration }); // Debug log
    return { wordCount: words, estimatedDurationMinutes: duration };
  }, [turns]); // Recalculate when local turns change

  const handleAudioGeneration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the transcript string from context (which should be synced on save)
      await generateAudio({
        transcript: transcriptStringFromContext, // Use string from context
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

  // Function to generate segment audio (passed to TranscriptEditor)
  const handleGenerateSegmentAudio = async (
    index: number,
    speaker: string, 
    text: string
  ): Promise<void> => {
    // This function now correctly uses the generateSegmentAudio from useAudio context
    if (!generateSegmentAudio) {
      throw new Error("Segment audio generation function not available from context.");
    }
    // Error handling might be managed within useAudio, but double-check
    setError(null);
    try {
      // Call the context function - it returns the absolute URL when done
      const absoluteAudioUrl = await generateSegmentAudio(speaker, text, voiceMappings);

      // Update the specific turn in App state with the received URL
      handleTurnUpdate(index, { audioUrl: absoluteAudioUrl });

    } catch(err) {
      setError(err instanceof Error ? err.message : "Failed to initiate segment audio generation");
      throw err; // Re-throw for TranscriptEditor's internal handling
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
          onStepClick={handleStepChange} // Use updated handler with dirty check
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
                  characters={uniqueCharacters}
                  onSubmit={handleVoiceConfigSubmit}
                  isLoading={isLoading}
                />
              </div>
            )}

            {step === 3 && (
              <div className="animate-fadeIn">
                <TranscriptEditor
                  turns={turns}
                  onSave={handleTranscriptSave}
                  isLoading={isLoading || isGeneratingSegment}
                  characters={uniqueCharacters}
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
                  disabled={isLoading || isGenerating || isGeneratingSegment || isTranscriptDirty}
                >
                  {isLoading ? "Generating..." : "Generate Full Audio"}
                </button>
                {isTranscriptDirty && (
                  <p className="text-warning text-sm mt-2">Save transcript changes before generating audio.</p>
                )}
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