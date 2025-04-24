import { useState } from 'react';
import { SpeakerVoiceMapping } from '../types/speaker';

interface UseSegmentAudioGenerationReturn {
  generateSegmentAudio: (speaker: string, text: string, voiceMappings: Record<string, SpeakerVoiceMapping>) => Promise<string>;
  isGenerating: boolean;
  error: string | null;
}

export function useSegmentAudioGeneration(apiBaseUrl: string = ''): UseSegmentAudioGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSegmentAudio = async (
    speaker: string, 
    text: string, 
    voiceMappings: Record<string, SpeakerVoiceMapping>
  ): Promise<string> => {
    try {
      setIsGenerating(true);
      setError(null);
      
      if (!voiceMappings[speaker]) {
        throw new Error(`No voice configuration found for speaker: ${speaker}`);
      }
      
      // Log the payload for debugging
      const payload = {
        speaker,
        text,
        voiceConfig: voiceMappings[speaker]
      };
      console.log('Segment audio payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${apiBaseUrl}/api/generate-segment-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        // Get more details if available in error response
        let errorDetails = response.statusText;
        try {
          const errorData = await response.json();
          errorDetails = errorData.detail || errorData.message || errorDetails;
          console.error('API error details:', errorData);
        } catch (e) {
          // If can't parse JSON, use status text
        }
        throw new Error(`Failed to generate audio: ${errorDetails}`);
      }
      
      // For SSE responses, we need to handle the stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');
      
      let audioUrl = '';
      
      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          // Parse the SSE data
          const match = line.match(/^data: (.+)$/m);
          if (!match) continue;
          
          try {
            const data = JSON.parse(match[1]);
            
            // Handle different event types
            if (data.type === 'segment_complete') {
              // Construct the absolute URL using the correct static mount path
              audioUrl = `${apiBaseUrl}/audio/${data.segment_path}`;
            } else if (data.type === 'complete') {
              if (!audioUrl && data.segments && data.segments.length > 0) {
                // Construct the absolute URL using the correct static mount path
                audioUrl = `${apiBaseUrl}/audio/${data.segments[0].path}`;
              }
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Unknown error');
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
      
      // For demo purposes, return a placeholder URL if no real URL was found
      return audioUrl || 'https://example.com/segment-audio.mp3';
    } catch (error) {
      console.error('Failed to generate segment audio:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateSegmentAudio,
    isGenerating,
    error
  };
} 