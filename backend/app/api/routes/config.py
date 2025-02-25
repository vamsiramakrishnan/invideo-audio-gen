from fastapi import APIRouter
from app.core.models import (
    PodcastConfig,
    VoiceConfigurationOptions,
    VoiceMetadata,
    Gender,
    AccentType,
    VoiceTone
)

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
    return {
        "neutral_professional": VoiceMetadata(
            icon="🎙️",
            color="#4A90E2",
            description="A balanced, professional voice suitable for business and educational content",
            tags=["professional", "clear", "neutral"]
        ),
        "warm_casual": VoiceMetadata(
            icon="🗣️",
            color="#F5A623",
            description="A warm, friendly voice perfect for casual conversations and storytelling",
            tags=["warm", "friendly", "casual"]
        ),
        "energetic_host": VoiceMetadata(
            icon="🎤",
            color="#7ED321",
            description="An energetic, engaging voice ideal for hosting and presentations",
            tags=["energetic", "engaging", "dynamic"]
        ),
        "authoritative_expert": VoiceMetadata(
            icon="👨‍🏫",
            color="#9013FE",
            description="An authoritative voice for expert discussions and technical content",
            tags=["authoritative", "expert", "precise"]
        ),
        "calm_narrator": VoiceMetadata(
            icon="📚",
            color="#50E3C2",
            description="A calm, soothing voice perfect for narration and explanations",
            tags=["calm", "soothing", "clear"]
        )
    } 