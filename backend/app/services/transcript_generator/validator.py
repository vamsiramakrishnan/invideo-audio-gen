from typing import List, Set, Dict
from app.core.models import ConceptRequest

class TranscriptValidator:
    @staticmethod
    def validate_transcript(transcript: str, request: ConceptRequest) -> None:
        """
        Validate the generated transcript format and content.
        
        Args:
            transcript: Generated transcript text
            request: Original concept request
            
        Raises:
            ValueError: If validation fails
        """
        # Split into lines and clean
        lines = [line.strip() for line in transcript.split('\n') if line.strip()]
        
        # Validate format
        invalid_lines = [
            line for line in lines 
            if not any(line.startswith(f"{name}:") for name in request.character_names)
        ]
        if invalid_lines:
            raise ValueError(
                f"Transcript format invalid. Each line must start with a speaker name followed by ':'. "
                f"Invalid lines found: {invalid_lines[:3]}"
            )

        # Check all speakers are present
        speakers_found = set(line.split(':')[0].strip() for line in lines)
        missing_speakers = set(request.character_names) - speakers_found
        if missing_speakers:
            raise ValueError(f"Some speakers are missing from the transcript: {', '.join(missing_speakers)}")

        # Check for balanced participation
        speaker_counts = {
            name: sum(1 for line in lines if line.startswith(f"{name}:")) 
            for name in request.character_names
        }
        min_count = min(speaker_counts.values())
        max_count = max(speaker_counts.values())
        if max_count > min_count * 2:  # Allow up to 2x difference in participation
            raise ValueError("Speaker participation is too unbalanced") 