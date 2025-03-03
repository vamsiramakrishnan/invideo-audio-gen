from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from google import genai
from google.genai.types import Content, GenerateContentConfig, Part, SpeechConfig, VoiceConfig
import os

from app.core.config import settings
from .processor import AudioProcessor
from .utils import generate_unique_run_id
from .config import VOICE_CONFIGS, SPEAKER_CONFIG_OPTIONS

class AudioGenerator:
    def __init__(self):
        """Initialize the AudioGenerator with necessary components."""
        self.client = genai.Client(
            project=settings.PROJECT_ID,
            location="us-central1",
            vertexai=True
        )
        self.processor = AudioProcessor()
        self.run_id = generate_unique_run_id()
        self.output_dir = Path(settings.AUDIO_DIR)
        self.segments_dir = self.output_dir / "segments"
        
        # Create necessary directories
        self.output_dir.mkdir(exist_ok=True)
        self.segments_dir.mkdir(exist_ok=True)

    def _create_voice_prompt(self, config: Dict[str, Any]) -> str:
        """
        Create a detailed voice prompt from speaker configuration.
        
        Args:
            config: Complete speaker configuration from frontend
            
        Returns:
            str: Detailed prompt for voice generation
        """
        # Basic characteristics
        prompt = [
            f"You are a {config['gender']} speaker aged {config['age']} with a {config['voice_tone']} voice.",
            f"Your accent is {config['accent']}.",
            f"You are {config['persona']} with {config['background']}.",
        ]

        # Speaking rates
        prompt.append(
            f"Your speaking rate varies: {config['speaking_rate']['normal']} words/min normally, "
            f"{config['speaking_rate']['excited']} words/min when excited, and "
            f"{config['speaking_rate']['analytical']} words/min during analysis."
        )

        # Voice characteristics
        characteristics = config['voice_characteristics']
        prompt.extend([
            f"Voice characteristics:",
            f"- Pitch range: {characteristics['pitch_range']}",
            f"- Resonance: {characteristics['resonance']}",
            f"- Breathiness: {characteristics['breathiness']}",
            f"- Vocal energy: {characteristics['vocal_energy']}",
            f"- Pausing: {characteristics['pause_pattern']}",
            f"- Emphasis: {characteristics['emphasis_pattern']}",
            f"- Emotional range: {characteristics['emotional_range']}",
            f"- Breathing: {characteristics['breathing_pattern']}"
        ])

        # Speech patterns
        patterns = config['speech_patterns']
        prompt.extend([
            f"Speech patterns:",
            f"- Phrasing: {patterns['phrasing']}",
            f"- Rhythm: {patterns['rhythm']}",
            f"- Articulation: {patterns['articulation']}",
            f"- Modulation: {patterns['modulation']}"
        ])

        return "\n".join(prompt)

    async def _generate_segment(
        self, 
        text: str, 
        voice: str, 
        speaker_config: Dict[str, Any]
    ) -> Tuple[Any, str]:
        """Generate a single audio segment with detailed voice configuration."""
        try:
            # Create voice configuration
            voice_config = VoiceConfig(
                prebuilt_voice_config={
                    "voice_name": voice,
                    "speaking_rate": speaker_config["speaking_rate"]["normal"] / 100.0,  # Convert to multiplier
                }
            )

            # Create speech configuration
            speech_config = SpeechConfig(
                voice_config=voice_config,
            )

            # Generate content configuration
            config = GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=speech_config
            )

            # Create detailed prompt
            voice_prompt = self._create_voice_prompt(speaker_config)

            # Generate content
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=[
                    Part(text=voice_prompt),
                    Part(text=text)
                ],
                config=config
            )

            if not response.candidates:
                raise ValueError("No audio generated")

            # Get audio data
            audio_data = response.candidates[0].content.parts[0].audio.data

            # Process audio with our custom processor
            processed_audio = self.processor.normalize_audio(audio_data)

            return processed_audio

        except Exception as e:
            raise RuntimeError(f"Failed to generate audio segment: {str(e)}")

    async def generate(self, request: Dict[str, Any]):
        """Generate audio from transcript with voice mappings."""
        transcript = request["transcript"]
        voice_mappings = request["voiceMappings"]
        
        # Parse transcript into segments
        segments = []
        current_speaker = None
        current_text = []
        
        for line in transcript.split("\n"):
            if not line.strip():
                continue
                
            if ":" in line:
                # If we have accumulated text for a previous speaker, add it
                if current_speaker and current_text:
                    segments.append((current_speaker, " ".join(current_text)))
                    current_text = []
                
                # Start new speaker segment
                speaker, text = line.split(":", 1)
                current_speaker = speaker.strip()
                current_text = [text.strip()]
            else:
                # Continue previous speaker's text
                current_text.append(line.strip())
        
        # Add final segment
        if current_speaker and current_text:
            segments.append((current_speaker, " ".join(current_text)))

        # Generate audio for each segment
        audio_segments = []
        total_segments = len(segments)
        
        for idx, (speaker, text) in enumerate(segments, 1):
            if speaker not in voice_mappings:
                raise ValueError(f"No voice mapping found for speaker: {speaker}")
            
            # Yield progress update
            yield {
                "type": "progress",
                "stage": "generating",
                "message": f"Generating audio for {speaker}",
                "speaker": speaker,
                "progress": {
                    "current": idx,
                    "total": total_segments,
                    "percentage": (idx / total_segments) * 100
                }
            }
            
            # Get voice configuration
            voice_config = voice_mappings[speaker]
            voice = voice_config["voice"]
            speaker_config = voice_config["config"]
            
            # Generate segment
            try:
                segment_result, segment_path = await self._generate_segment(text, voice, speaker_config)
                
                # Yield segment completion
                yield {
                    "type": "segment_complete",
                    "stage": "segment_generated",
                    "speaker": speaker,
                    "segment_path": segment_path,
                    "duration": segment_result.duration if hasattr(segment_result, 'duration') else None,
                    "progress": {
                        "current": idx,
                        "total": total_segments,
                        "percentage": (idx / total_segments) * 100
                    }
                }
                
                audio_segments.append({
                    "speaker": speaker,
                    "path": segment_path,
                    "duration": segment_result.duration if hasattr(segment_result, 'duration') else None
                })
                
            except Exception as e:
                yield {
                    "type": "error",
                    "stage": "segment_failed",
                    "speaker": speaker,
                    "error": str(e),
                    "progress": {
                        "current": idx,
                        "total": total_segments,
                        "percentage": (idx / total_segments) * 100
                    }
                }
                raise
        
        # Final completion message
        yield {
            "type": "complete",
            "stage": "generation_complete",
            "message": "Audio generation complete",
            "segments": audio_segments,
            "progress": {
                "current": total_segments,
                "total": total_segments,
                "percentage": 100
            }
        }

    def parse_transcript(self, transcript: str) -> List[Tuple[str, str]]:
        """Parse transcript into list of (speaker, text) tuples."""
        dialogue = []
        for line in transcript.split('\n'):
            if ':' in line:
                speaker, text = line.split(':', 1)
                dialogue.append((speaker.strip(), text.strip()))
        return dialogue

    async def generate_single_segment(self, request: Dict[str, Any]):
        """Generate audio for a single segment with voice configuration."""
        speaker = request["speaker"]
        text = request["text"]
        voice_config = request["voiceConfig"]
        
        voice = voice_config["voice"]
        speaker_config = voice_config["config"]
        
        # Yield initial progress update
        yield {
            "type": "progress",
            "stage": "generating",
            "message": f"Generating audio for {speaker}",
            "speaker": speaker,
            "progress": {
                "current": 0,
                "total": 1,
                "percentage": 0
            }
        }
        
        # Generate segment
        try:
            # Update progress
            yield {
                "type": "progress",
                "stage": "processing",
                "message": f"Processing audio for {speaker}",
                "speaker": speaker,
                "progress": {
                    "current": 0,
                    "total": 1,
                    "percentage": 50
                }
            }
            
            # Generate the audio segment
            segment_audio, segment_path = await self._generate_segment(text, voice, speaker_config)
            
            # Yield segment completion
            yield {
                "type": "segment_complete",
                "stage": "segment_generated",
                "speaker": speaker,
                "segment_path": segment_path,
                "duration": segment_audio.duration if hasattr(segment_audio, 'duration') else None,
                "progress": {
                    "current": 1,
                    "total": 1,
                    "percentage": 100
                }
            }
            
            # Final completion message
            yield {
                "type": "complete",
                "stage": "generation_complete",
                "message": "Audio generation complete",
                "segments": [{
                    "speaker": speaker,
                    "path": segment_path,
                    "duration": segment_audio.duration if hasattr(segment_audio, 'duration') else None
                }],
                "progress": {
                    "current": 1,
                    "total": 1,
                    "percentage": 100
                }
            }
            
        except Exception as e:
            yield {
                "type": "error",
                "stage": "segment_failed",
                "speaker": speaker,
                "error": str(e),
                "progress": {
                    "current": 0,
                    "total": 1,
                    "percentage": 0
                }
            }
            raise

    def get_available_voices(self) -> Dict[str, Dict[str, str]]:
        """Get available voice options with metadata."""
        return VOICE_CONFIGS

    def get_config_options(self) -> Dict[str, Any]:
        """Get available configuration options for speakers."""
        return SPEAKER_CONFIG_OPTIONS