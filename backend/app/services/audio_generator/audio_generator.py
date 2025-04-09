from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from google import genai
from google.genai.types import Content, GenerateContentConfig, Part, SpeechConfig, VoiceConfig
import os
import io # Import io for BytesIO
from pydub import AudioSegment # Ensure pydub is imported

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
        """
        Generate a single audio segment, save it, and return the relative path.

        Args:
            text (str): The text to synthesize.
            voice (str): The prebuilt voice name.
            speaker_config (Dict[str, Any]): Speaker configuration.

        Returns:
            Tuple[Any, str]: A tuple containing the processed audio object (if needed, e.g., for duration) 
                             and the relative path to the saved audio file.
        """
        try:
            # Create voice configuration (without speaking_rate)
            voice_config = VoiceConfig(
                prebuilt_voice_config={
                    "voice_name": voice,
                }
            )

            # Create speech configuration (just voice_config)
            speech_config = SpeechConfig(
                voice_config=voice_config,
                # speaking_rate=speaker_config["speaking_rate"]["normal"] / 100.0, # Removed based on schema
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

            # Get audio part and ensure it has inline_data
            audio_part = response.candidates[0].content.parts[0]
            if not audio_part.inline_data:
                raise ValueError("No inline audio data found in the response")
            
            # Get raw audio bytes and mime type
            audio_bytes = audio_part.inline_data.data
            mime_type = audio_part.inline_data.mime_type

            # Determine audio format from mime type
            if mime_type == "audio/wav":
                audio_stream = io.BytesIO(audio_bytes)
                audio_segment = AudioSegment.from_file(audio_stream, format="wav")
            elif mime_type == "audio/mp3":
                audio_stream = io.BytesIO(audio_bytes)
                audio_segment = AudioSegment.from_file(audio_stream, format="mp3")
            elif mime_type and mime_type.startswith("audio/L16"):
                # Handle raw PCM data (L16)
                try:
                    # Extract rate parameter (e.g., from 'audio/L16;codec=pcm;rate=24000')
                    # Basic parsing, might need refinement for more complex mime strings
                    params = dict(p.split('=') for p in mime_type.split(';')[1:] if '=' in p)
                    rate = int(params.get('rate', 24000)) # Default to 24k if not found
                    sample_width = 2 # L16 means 16-bit = 2 bytes
                    channels = 1 # Assume mono
                    
                    audio_segment = AudioSegment(
                        data=audio_bytes,
                        sample_width=sample_width,
                        frame_rate=rate,
                        channels=channels
                    )
                    print(f"Successfully parsed L16 audio with rate={rate}Hz")
                except Exception as parse_err:
                    print(f"Error parsing L16 mime type '{mime_type}': {parse_err}")
                    # Fallback or raise error
                    raise ValueError(f"Could not parse L16 audio parameters from mime type: {mime_type}") from parse_err
            else:
                # Fallback for other unrecognized types - try letting pydub guess from stream
                print(f"Warning: Unrecognized audio mime type '{mime_type}'. Attempting to load directly.")
                try:
                    audio_stream = io.BytesIO(audio_bytes)
                    audio_segment = AudioSegment.from_file(audio_stream)
                except Exception as load_err:
                     print(f"Error loading audio with unrecognized mime type '{mime_type}': {load_err}")
                     raise ValueError(f"Could not load audio data with mime type: {mime_type}") from load_err

            # Process audio with our custom processor
            processed_audio = self.processor.normalize_audio(audio_segment)

            # Generate unique filename (use .mp3 for better browser compatibility)
            segment_filename = f"{self.run_id}_{speaker_config.get('name', 'unknown')}_{generate_unique_run_id()}.mp3"
            segment_path = self.segments_dir / segment_filename
            
            # Save the processed audio using the processor, explicitly setting format to mp3
            saved_path = self.processor.save_audio(processed_audio, segment_path, format="mp3")
            
            # Return the processed audio object and its relative path
            relative_path = os.path.join("segments", segment_filename) # Path relative to AUDIO_DIR
            
            # Make sure to return the processed audio object itself if needed for duration etc.
            # If AudioProcessor.save_audio doesn't return the object, keep processed_audio
            return processed_audio, relative_path 

        except Exception as e:
            # Enhanced error logging
            import traceback
            traceback.print_exc()
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
                # segment_result is the processed audio object, segment_path is the relative URL
                segment_result, relative_segment_path = await self._generate_segment(text, voice, speaker_config) 
                
                # Yield segment completion with the relative path for the frontend
                # Use the correct static mount path defined in main.py
                audio_url = f"/audio/{relative_segment_path}"
                yield {
                    "type": "segment_complete",
                    "stage": "segment_generated",
                    "speaker": speaker,
                    "audioUrl": audio_url, # Use the constructed static URL
                    "duration": segment_result.duration if hasattr(segment_result, 'duration') else None, 
                    "progress": {
                        "current": idx,
                        "total": total_segments,
                        "percentage": (idx / total_segments) * 100
                    }
                }
                
                audio_segments.append({
                    "speaker": speaker,
                    "path": relative_segment_path, # Store relative path internally if needed
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
            # segment_audio is the processed audio object, relative_segment_path is the relative URL
            segment_audio, relative_segment_path = await self._generate_segment(text, voice, speaker_config)
            
            # Yield segment completion with the RELATIVE path for the frontend hook
            yield {
                "type": "segment_complete",
                "stage": "segment_generated",
                "speaker": speaker,
                "segment_path": relative_segment_path, # Use relative_segment_path with key segment_path
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
                    "path": relative_segment_path, # Store relative path internally if needed
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