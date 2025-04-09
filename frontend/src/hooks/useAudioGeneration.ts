import { useState, useCallback } from 'react';
import { ProgressUpdate, GenerationRequest } from '../types/audio';

const createErrorUpdate = (message: string): ProgressUpdate => ({
  type: 'error',
  stage: 'generation_failed',
  error: message,
  progress: {
    current: 0,
    total: 0,
    percentage: 0
  }
});

export function useAudioGeneration(apiBaseUrl: string = '') {
  const [isGenerating, setIsGenerating] = useState(false);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);

  const generateAudio = useCallback(async (request: GenerationRequest) => {
    setIsGenerating(true);
    setUpdates([]);

    try {
      const response = await fetch(`${apiBaseUrl}/api/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        let errorDetails = `HTTP error! status: ${response.status}`;
        try {
            const errorJson = await response.json();
            errorDetails = errorJson.detail || errorDetails;
        } catch {
            // Ignore if body is not JSON or empty
        }
        throw new Error(errorDetails);
      }
      
      if (!response.body) {
          throw new Error('Response body is missing.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          const lastUpdate = updates[updates.length - 1];
          if (lastUpdate && lastUpdate.type !== 'complete' && lastUpdate.type !== 'error') {
              console.warn('Stream ended without a final complete/error message.');
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          let eventType = 'message';
          let jsonData = '';

          const eventMatch = line.match(/^event: (.+)/m);
          if (eventMatch) {
            eventType = eventMatch[1].trim();
          }

          const dataMatch = line.match(/^data: (.+)/m);
          if (dataMatch) {
            jsonData = dataMatch[1].trim();
          } else {
            continue;
          }
          
          if (jsonData) {
            try {
              const update = JSON.parse(jsonData) as ProgressUpdate;
              console.log("Received update:", update);
              setUpdates(prev => [...prev, update]);
              
              if (update.type === 'complete' || update.type === 'error') {
                  setIsGenerating(false); 
              }
            } catch (e) {
              console.error('Failed to parse SSE JSON:', jsonData, e);
              setUpdates(prev => [...prev, createErrorUpdate('Failed to parse server update')]);
            }
          }
        }
      }
      setIsGenerating(false); 

    } catch (error) {
        console.error("Error during fetch/stream processing:", error);
      setUpdates(prev => [
        ...prev,
        createErrorUpdate(error instanceof Error ? error.message : 'Unknown fetch/stream error occurred')
      ]);
      setIsGenerating(false);
    }
  }, [apiBaseUrl]);

  return {
    generateAudio,
    isGenerating,
    updates,
    latestUpdate: updates[updates.length - 1],
    hasError: updates.some(update => update.type === 'error'),
    isComplete: updates.some(update => update.type === 'complete'),
    completedSegments: updates.filter(update => update.type === 'segment_complete')
  };
}
