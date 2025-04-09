from pathlib import Path
from pydub import AudioSegment
from typing import List, Tuple, Optional
import os

class AudioProcessor:
    def __init__(self):
        self.crossfade_duration = 1000  # milliseconds
        self.silence_duration = 500  # milliseconds
        self.background_music_volume = -20  # dB

    def combine_segments(self, segments: List[Tuple[AudioSegment, str]]) -> AudioSegment:
        """Combine multiple audio segments with crossfading and silence."""
        if not segments:
            raise ValueError("No audio segments provided")
            
        combined = segments[0][0]
        
        for next_segment, _ in segments[1:]:
            # Add silence between segments
            silence = AudioSegment.silent(duration=self.silence_duration)
            combined = combined.append(silence, crossfade=self.crossfade_duration)
            
            # Add next segment
            combined = combined.append(next_segment, crossfade=self.crossfade_duration)
        
        return combined

    def save_audio(self, audio: AudioSegment, filepath: Path, format: str = "wav") -> str:
        """Save the audio segment to a file and return the path."""
        # Ensure filepath is a Path object if it isn't already
        output_path = Path(filepath) 
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Export expects a string path and uses the provided format
        audio.export(str(output_path), format=format)
        return str(output_path)

    def normalize_audio(self, audio: AudioSegment, target_db: float = -20.0) -> AudioSegment:
        """Normalize audio to a target dB level."""
        difference = target_db - audio.dBFS
        return audio.apply_gain(difference) 