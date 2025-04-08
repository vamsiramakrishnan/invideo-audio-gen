import React, { createContext, useContext, useState } from 'react';
import { PodcastConcept } from '../types/podcast';
import { SpeakerVoiceMapping } from '../types/speaker';

interface Step {
  label: string;
  desc: string;
}

interface PodcastContextType {
  step: number;
  steps: Step[];
  transcript: string;
  characters: string[];
  voiceMappings: Record<string, SpeakerVoiceMapping>;
  error: string | null;
  isLoading: boolean;
  setStep: (step: number) => void;
  setTranscript: (transcript: string) => void;
  setCharacters: (characters: string[]) => void;
  setVoiceMappings: (mappings: Record<string, SpeakerVoiceMapping>) => void;
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  handleConceptSubmit: (concept: PodcastConcept) => Promise<void>;
  handleTranscriptSave: (transcript: string) => Promise<void>;
  clearPodcastState: () => void;
  wordCount: number | null;
  setWordCount: (wordCount: number | null) => void;
  estimatedDurationMinutes: number | null;
  setEstimatedDurationMinutes: (estimatedDurationMinutes: number | null) => void;
}

const PodcastContext = createContext<PodcastContextType | undefined>(undefined);

export const PodcastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [step, setStep] = useState(1);
  const [transcript, setTranscript] = useState('');
  const [characters, setCharacters] = useState<string[]>([]);
  const [voiceMappings, setVoiceMappings] = useState<Record<string, SpeakerVoiceMapping>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState<number | null>(null);

  const steps = [
    { label: 'Concept', desc: 'Define your podcast' },
    { label: 'Transcript', desc: 'Edit content' },
    { label: 'Voices', desc: 'Configure voices' },
    { label: 'Audio', desc: 'Listen & export' }
  ];

  const handleConceptSubmit = async (concept: PodcastConcept) => {
    try {
      setIsLoading(true);
      setError(null);
      setCharacters(concept.character_names);
      // Add your concept submission logic here
      setStep(2);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscriptSave = async (newTranscript: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setTranscript(newTranscript);
      // Add your transcript save logic here
      setStep(3);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const clearPodcastState = () => {
    setStep(1);
    setTranscript('');
    setCharacters([]);
    setVoiceMappings({});
    setError(null);
    setIsLoading(false);
    setWordCount(null);
    setEstimatedDurationMinutes(null);
  };

  const contextValue: PodcastContextType = {
    step,
    steps,
    transcript,
    characters,
    voiceMappings,
    error,
    isLoading,
    setStep,
    setTranscript,
    setCharacters,
    setVoiceMappings,
    setError,
    setIsLoading,
    handleConceptSubmit,
    handleTranscriptSave,
    clearPodcastState,
    wordCount,
    setWordCount,
    estimatedDurationMinutes,
    setEstimatedDurationMinutes
  };

  return (
    <PodcastContext.Provider value={contextValue}>
      {children}
    </PodcastContext.Provider>
  );
};

export const usePodcast = () => {
  const context = useContext(PodcastContext);
  if (context === undefined) {
    throw new Error('usePodcast must be used within a PodcastProvider');
  }
  return context;
}; 