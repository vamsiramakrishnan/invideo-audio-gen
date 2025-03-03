from typing import List, Dict
from google import genai
from pydantic import TypeAdapter
from app.core.models import SpeakerConfig, VoiceCharacteristics, SpeakingRate, SpeechPatterns
from app.core.config import settings

class VoiceConfigGenerator:
    def __init__(self):
        """Initialize the VoiceConfigGenerator with Gemini client."""
        self.client = genai.Client(
            project=settings.PROJECT_ID,
            location="us-central1", 
            vertexai=True
        )

    def _create_prompt(self, transcript: str, speakers: List[str]) -> str:
        """Create a prompt for Gemini to generate voice configurations."""
        return f"""Given the following transcript and list of speakers, generate detailed voice configurations for each speaker.
        The configurations should be natural and match the speaker's role and personality in the conversation.

        Transcript:
        {transcript}

        Speakers: {', '.join(speakers)}

        For each speaker, provide a complete voice configuration that includes:
        - A suitable age (between 20-70)
        - Gender (male/female/neutral)
        - A fitting persona description
        - Professional/personal background
        - Voice tone (warm/professional/energetic/etc)
        - Accent (neutral/british/american/etc)
        - Speaking rate configuration (normal/excited/analytical speeds)
        - Voice characteristics (pitch, resonance, breathiness, etc)
        - Speech patterns (phrasing, rhythm, articulation, etc)

        Ensure the configurations are diverse and match each speaker's role in the conversation.
        Return the configurations in a structured JSON format matching the SpeakerConfig schema.
        """

    async def generate_configs(self, transcript: str, speakers: List[str]) -> Dict[str, SpeakerConfig]:
        """Generate voice configurations for all speakers in the transcript."""
        try:
            prompt = self._create_prompt(transcript, speakers)
            
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-001",
                contents=[{"text": prompt}],
                config={
                    "max_output_tokens": 8192,
                }
            )

            if not response.candidates:
                raise ValueError("No configurations generated")

            # Parse the response using Pydantic's TypeAdapter
            adapter = TypeAdapter(Dict[str, SpeakerConfig])
            configs = adapter.validate_json(response.candidates[0].content.parts[0].text)
            
            return configs

        except Exception as e:
            raise Exception(f"Failed to generate voice configurations: {str(e)}")

    def _validate_config(self, config: Dict[str, SpeakerConfig]) -> bool:
        """Validate the generated configuration."""
        try:
            for speaker, cfg in config.items():
                # Validate age range
                if not (20 <= cfg.age <= 70):
                    return False
                
                # Validate gender
                if cfg.gender.lower() not in ['male', 'female', 'neutral']:
                    return False
                
                # Validate speaking rate values
                if not all(0 <= rate <= 2.0 for rate in [
                    cfg.speaking_rate.normal,
                    cfg.speaking_rate.excited,
                    cfg.speaking_rate.analytical
                ]):
                    return False
                
            return True
        except Exception:
            return False