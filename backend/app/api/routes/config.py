from fastapi import APIRouter
from app.core.models import (
    PodcastConfig,
    VoiceConfigurationOptions,
    VoiceMetadata,
    Gender,
    AccentType,
    VoiceTone
)
from app.services.audio_generator.config import VOICE_CONFIGS, SPEAKER_CONFIG_OPTIONS
import json
from pathlib import Path

router = APIRouter(prefix="/config")

@router.get("/", response_model=PodcastConfig)
async def get_podcast_config():
    """
    Get podcast configuration options including available durations, 
    number of speakers, expertise levels, and format styles.
    """
    return PodcastConfig()

@router.get("/voice", response_model=VoiceConfigurationOptions)
async def get_voice_config():
    """
    Get voice configuration options including available voices,
    speaking rates, and voice characteristics.
    """
    return VoiceConfigurationOptions()

@router.get("/voice/metadata", response_model=dict[str, VoiceMetadata])
async def get_voice_metadata():
    """
    Get metadata for available voices including icons, colors,
    descriptions, and tags.
    """
    # Convert VOICE_CONFIGS to match VoiceMetadata model
    return {
        voice_name: VoiceMetadata(
            icon=config["icon"],
            color=config["color"],
            description=config["description"],
            tags=[]  # Default empty tags array
        )
        for voice_name, config in VOICE_CONFIGS.items()
    }

@router.get("/voice/speaker-mappings")
async def get_voice_speaker_mappings():
    """
    Get predefined speaker configurations with voice mappings.
    This allows the frontend to map voice names to speaker configurations.
    """
    try:
        # Path to speaker_configs.json file in the backend directory
        configs_path = Path(__file__).parents[3] / "speaker_configs.json"
        
        # Read and parse the speaker configs file
        with open(configs_path, "r") as f:
            speaker_configs = json.load(f)
            
        # Return the speaker configs with their associated voice mappings
        return speaker_configs
    except Exception as e:
        return {"error": f"Failed to load speaker configurations: {str(e)}"}

@router.get("/voice/style-presets")
async def get_voice_style_presets():
    """
    Get predefined voice style presets for common use cases.
    """
    # This could be expanded with actual presets
    return {
        "neutral_professional": {
            "voice_tone": "professional",
            "speaking_rate": {"normal": 150, "excited": 160, "analytical": 140},
            "voice_characteristics": {
                "pitch_range": "medium",
                "resonance": "mixed",
                "breathiness": "low",
                "vocal_energy": "moderate",
                "pause_pattern": "natural",
                "emphasis_pattern": "balanced",
                "emotional_range": "neutral",
                "breathing_pattern": "relaxed"
            }
        },
        "warm_casual": {
            "voice_tone": "warm",
            "speaking_rate": {"normal": 160, "excited": 175, "analytical": 145},
            "voice_characteristics": {
                "pitch_range": "wide",
                "resonance": "chest",
                "breathiness": "medium",
                "vocal_energy": "high",
                "pause_pattern": "natural",
                "emphasis_pattern": "strong",
                "emotional_range": "expressive",
                "breathing_pattern": "dynamic"
            }
        }
        # Add more presets as needed
    } 