from typing import Dict, Any
from google import genai
from google.genai.types import Content, GenerateContentConfig, Part
from fastapi import HTTPException

from app.core.config import settings
from app.core.models import ConceptRequest, TranscriptEditRequest
from .prompts import PromptGenerator
from .validator import TranscriptValidator

class TranscriptGenerator:
    def __init__(self):
        """Initialize the TranscriptGenerator with Gemini client."""
        self.client = genai.Client(
            project=settings.PROJECT_ID,
            location="us-central1",
            vertexai=True
        )
        self.validator = TranscriptValidator()

    async def generate(self, request: ConceptRequest) -> str:
        """
        Generate a podcast transcript based on the concept request.
        
        Args:
            request: ConceptRequest containing podcast parameters
            
        Returns:
            str: Generated transcript
            
        Raises:
            HTTPException: If generation or validation fails
        """
        try:
            # Validate request
            if len(request.character_names) != request.num_speakers:
                raise ValueError("Number of speakers must match number of character names")
            
            # Create prompt
            prompt = PromptGenerator.create_podcast_prompt(request)
            
            # Configure generation parameters
            config = GenerateContentConfig(
                max_output_tokens=8192,
            )

            # Generate content using Gemini
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-001",
                contents=[Part(text=prompt)],
                config=config
            )

            # Extract transcript
            if not response.candidates:
                raise ValueError("No transcript generated")
                
            transcript = response.candidates[0].content.parts[0].text
            
            # Validate transcript
            self.validator.validate_transcript(transcript, request)
            
            return transcript

        except Exception as e:
            print(f"Error generating transcript: {str(e)}")  # Add logging
            raise HTTPException(status_code=500, detail=str(e))

    async def edit(self, request: TranscriptEditRequest) -> Dict[str, Any]:
        """
        Process edited transcript and extract characters.
        
        Args:
            request: TranscriptEditRequest containing edited transcript
            
        Returns:
            Dict containing processed transcript and character list
        """
        try:
            # Extract unique character names from transcript
            characters = set()
            for line in request.transcript.split('\n'):
                if ':' in line:
                    character = line.split(':')[0].strip()
                    characters.add(character)
            
            return {
                "success": True,
                "transcript": request.transcript,
                "characters": list(characters)
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 