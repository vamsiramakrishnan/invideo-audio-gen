from typing import Dict, Any
from google import genai
from google.genai.types import Content, GenerateContentConfig, Part
from fastapi import HTTPException
import re

from app.core.config import settings
from app.core.models import ConceptRequest, TranscriptEditRequest, TranscriptExtendRequest
from .prompts import PromptGenerator
from .validator import TranscriptValidator

# Add a constant for WPM
WORDS_PER_MINUTE = 150

class TranscriptGenerator:
    def __init__(self):
        """Initialize the TranscriptGenerator with Gemini client."""
        self.client = genai.Client(
            project=settings.PROJECT_ID,
            location="us-central1",
            vertexai=True
        )
        self.validator = TranscriptValidator()

    async def generate(self, request: ConceptRequest) -> Dict[str, Any]:
        """
        Generate a podcast transcript based on the concept request.
        
        Args:
            request: ConceptRequest containing podcast parameters
            
        Returns:
            Dict: Containing generated transcript and word count
            
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
            
            # Calculate word count
            word_count = len(re.findall(r'\w+', transcript))
            # Calculate estimated duration
            estimated_duration_minutes = round(word_count / WORDS_PER_MINUTE, 2) if WORDS_PER_MINUTE > 0 else 0

            return {
                "transcript": transcript,
                "word_count": word_count,
                "estimated_duration_minutes": estimated_duration_minutes
            }

        except Exception as e:
            print(f"Error generating transcript: {str(e)}")  # Add logging
            raise HTTPException(status_code=500, detail=str(e))

    async def edit(self, request: TranscriptEditRequest) -> Dict[str, Any]:
        """
        Process edited transcript, extract characters, and calculate word count.
        
        Args:
            request: TranscriptEditRequest containing edited transcript
            
        Returns:
            Dict containing processed transcript, character list, and word count
        """
        try:
            # Extract unique character names from transcript
            characters = set()
            for line in request.transcript.split('\n'):
                if ':' in line:
                    character = line.split(':')[0].strip()
                    characters.add(character)
            
            # Calculate word count
            word_count = len(re.findall(r'\w+', request.transcript))
            # Calculate estimated duration
            estimated_duration_minutes = round(word_count / WORDS_PER_MINUTE, 2) if WORDS_PER_MINUTE > 0 else 0

            return {
                "success": True,
                "transcript": request.transcript,
                "characters": list(characters),
                "word_count": word_count,
                "estimated_duration_minutes": estimated_duration_minutes
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def extend(self, request: TranscriptExtendRequest) -> Dict[str, Any]:
        """
        Extend an existing podcast transcript to meet a target duration.
        
        Args:
            request: TranscriptExtendRequest containing the current transcript,
                     target duration, and character names.
            
        Returns:
            Dict: Containing the extended transcript and updated metrics.
            
        Raises:
            HTTPException: If extension or validation fails
        """
        try:
            # Basic validation
            if not request.transcript or not request.characters:
                raise ValueError("Current transcript and characters are required for extension.")
            if request.target_duration_minutes <= 0:
                raise ValueError("Target duration must be positive.")

            # --- Prompt Engineering for Extension ---
            # Simple approach: Ask the model to continue the conversation.
            # A more sophisticated approach might involve analyzing the last few turns 
            # or providing more specific instructions based on the plot/topic.
            prompt = (
                f"Continue the following podcast conversation. The goal is to extend it "
                f"so the total estimated duration is around {request.target_duration_minutes} minutes "
                f"(assuming {WORDS_PER_MINUTE} words per minute). Maintain the existing characters, tone, and topic.\n\n"
                f"Characters involved: {', '.join(request.characters)}\n\n"
                f"Existing Transcript:\n"
                f"--------------------\n"
                f"{request.transcript}\n"
                f"--------------------\n\n"
                f"Continue the conversation naturally from here, adding more dialogue turns:"
            )

            # Configure generation parameters (might need adjustments for extension)
            config = GenerateContentConfig(
                max_output_tokens=8192, # Adjust if needed for longer extensions
                # Consider adding stop sequences if the model tends to add unwanted text
            )

            # Generate content using Gemini
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-001", # Or consider a model better suited for conversational continuation
                contents=[Part(text=prompt)],
                config=config
            )

            # Extract the *additional* transcript generated
            if not response.candidates or not response.candidates[0].content.parts:
                raise ValueError("No additional transcript generated for extension")
                
            additional_transcript_part = response.candidates[0].content.parts[0].text.strip()

            # Combine original and new parts
            # Ensure proper spacing/newlines between original and extended parts
            extended_transcript = request.transcript.strip() + "\n" + additional_transcript_part

            # --- Validation (Optional but recommended) ---
            # You might want to re-validate the *entire* extended transcript
            # or specifically the added part to ensure format consistency.
            # self.validator.validate_transcript(extended_transcript, ...) # Re-validation would need a ConceptRequest-like object or adapted method

            # Calculate word count and duration for the *full* extended transcript
            word_count = len(re.findall(r'\w+', extended_transcript))
            estimated_duration_minutes = round(word_count / WORDS_PER_MINUTE, 2) if WORDS_PER_MINUTE > 0 else 0

            return {
                "success": True,
                "transcript": extended_transcript,
                "word_count": word_count,
                "estimated_duration_minutes": estimated_duration_minutes
            }

        except ValueError as ve:
             print(f"Validation Error extending transcript: {str(ve)}")
             raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            print(f"Error extending transcript: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e)) 