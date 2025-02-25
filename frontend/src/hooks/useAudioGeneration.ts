import { useState, useCallback, useEffect } from 'react';
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

export function useAudioGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);

  const generateAudio = useCallback(async (request: GenerationRequest) => {
    setIsGenerating(true);
    setUpdates([]);

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create a new ReadableStream from the response body
      const reader = response.body!.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                controller.close();
                break;
              }
              
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });

      // Create a new response with the stream
      const newResponse = new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
        },
      });

      const eventSource = new EventSource(URL.createObjectURL(await newResponse.blob()));

      // Listen for specific event types
      ['progress', 'segment_complete', 'complete', 'error'].forEach(eventType => {
        eventSource.addEventListener(eventType, (event: MessageEvent) => {
          try {
            const update = JSON.parse(event.data) as ProgressUpdate;
            setUpdates(prev => [...prev, update]);
            
            if (update.type === 'complete' || update.type === 'error') {
              setIsGenerating(false);
              eventSource.close();
            }
          } catch (e) {
            console.error('Failed to parse SSE update:', e);
            setUpdates(prev => [...prev, createErrorUpdate('Failed to parse server update')]);
          }
        });
      });

      // Handle connection error
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setUpdates(prev => [...prev, createErrorUpdate('Connection error occurred')]);
        setIsGenerating(false);
        eventSource.close();
      };

    } catch (error) {
      setUpdates(prev => [
        ...prev,
        createErrorUpdate(error instanceof Error ? error.message : 'Unknown error occurred')
      ]);
      setIsGenerating(false);
    }
  }, []);

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
