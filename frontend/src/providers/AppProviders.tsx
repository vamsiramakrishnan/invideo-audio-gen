import React from 'react';
import { AudioProvider } from '../contexts/AudioContext';
import { VoiceProvider } from '../contexts/VoiceContext';
import { PodcastProvider } from '../contexts/PodcastContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Root provider component that composes all context providers.
 * The order matters - providers that depend on other providers should be nested inside them.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <PodcastProvider>
      <VoiceProvider>
        <AudioProvider>
          {children}
        </AudioProvider>
      </VoiceProvider>
    </PodcastProvider>
  );
}; 