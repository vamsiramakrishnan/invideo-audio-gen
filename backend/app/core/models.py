from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal

# Voice-related enums
class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"

class AccentType(str, Enum):
    NEUTRAL = "neutral"
    BRITISH = "british"
    AMERICAN = "american"
    AUSTRALIAN = "australian"
    INDIAN = "indian"

class VoiceTone(str, Enum):
    WARM = "warm"
    PROFESSIONAL = "professional"
    ENERGETIC = "energetic"
    CALM = "calm"
    AUTHORITATIVE = "authoritative"

# Existing models with enhanced validation
class SpeakingRate(BaseModel):
    normal: int = Field(..., ge=100, le=200, description="Normal speaking rate in words per minute")
    excited: int = Field(..., ge=120, le=220, description="Excited speaking rate in words per minute")
    analytical: int = Field(..., ge=80, le=180, description="Analytical speaking rate in words per minute")

class VoiceCharacteristics(BaseModel):
    pitch_range: str = Field(..., description="Range of pitch variation in speech")
    resonance: str = Field(..., description="Quality of voice resonance")
    breathiness: str = Field(..., description="Level of breathiness in voice")
    vocal_energy: str = Field(..., description="Energy level in voice delivery")
    pause_pattern: str = Field(..., description="Pattern of pauses in speech")
    emphasis_pattern: str = Field(..., description="Pattern of emphasis in speech")
    emotional_range: str = Field(..., description="Range of emotional expression")
    breathing_pattern: str = Field(..., description="Pattern of breathing in speech")

class SpeechPatterns(BaseModel):
    phrasing: str = Field(..., description="Style of phrase construction")
    rhythm: str = Field(..., description="Speech rhythm pattern")
    articulation: str = Field(..., description="Clarity of articulation")
    modulation: str = Field(..., description="Voice modulation pattern")

# Voice metadata for UI
class VoiceMetadata(BaseModel):
    icon: str = Field(..., description="Icon representation for the voice")
    color: str = Field(..., pattern="^#[0-9a-fA-F]{6}$", description="Hex color code for UI")
    description: str = Field(..., min_length=10, max_length=200, description="Voice description")
    tags: List[str] = Field(default_factory=list, description="Characteristic tags for the voice")

# Enhanced SpeakerConfig with validation
class SpeakerConfig(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    age: int = Field(..., ge=20, le=70, description="Speaker age between 20 and 70")
    gender: Gender
    persona: str = Field(..., min_length=5, max_length=100)
    background: str = Field(..., min_length=5, max_length=200)
    voice_tone: VoiceTone
    accent: AccentType
    speaking_rate: SpeakingRate
    voice_characteristics: VoiceCharacteristics
    speech_patterns: SpeechPatterns

class VoiceConfig(BaseModel):
    voice: str = Field(..., min_length=1, description="Voice identifier")
    config: SpeakerConfig

# Voice configuration options
class VoiceConfigurationOptions(BaseModel):
    age_range: tuple[int, int] = Field(
        default=(20, 70),
        description="Minimum and maximum age range"
    )
    genders: List[Gender] = Field(
        default_factory=lambda: list(Gender),
        description="Available gender options"
    )
    accents: List[AccentType] = Field(
        default_factory=lambda: list(AccentType),
        description="Available accent options"
    )
    voice_tones: List[VoiceTone] = Field(
        default_factory=lambda: list(VoiceTone),
        description="Available voice tone options"
    )
    speaking_rate_ranges: dict[Literal["normal", "excited", "analytical"], tuple[int, int]] = Field(
        default={
            "normal": (100, 200),
            "excited": (120, 220),
            "analytical": (80, 180)
        },
        description="Speaking rate ranges in words per minute"
    )
    voice_characteristics_options: Dict[str, List[str]] = Field(
        default={
            "pitch_range": ["narrow", "medium", "wide"],
            "resonance": ["chest", "head", "mixed"],
            "breathiness": ["low", "medium", "high"],
            "vocal_energy": ["low", "moderate", "high"],
            "pause_pattern": ["natural", "dramatic", "minimal"],
            "emphasis_pattern": ["balanced", "strong", "subtle"],
            "emotional_range": ["neutral", "expressive", "highly-expressive"],
            "breathing_pattern": ["relaxed", "controlled", "dynamic"]
        }
    )
    speech_patterns_options: Dict[str, List[str]] = Field(
        default={
            "phrasing": ["natural", "structured", "flowing"],
            "rhythm": ["regular", "varied", "dynamic"],
            "articulation": ["clear", "precise", "relaxed"],
            "modulation": ["subtle", "moderate", "dramatic"]
        }
    )

class ExpertiseLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    expert = "expert"
    mixed = "mixed"

class FormatStyle(str, Enum):
    casual = "casual"
    interview = "interview"
    debate = "debate"
    educational = "educational"
    storytelling = "storytelling"

class ConceptRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500, description="The main topic of the podcast")
    num_speakers: int = Field(..., ge=2, le=4, description="Number of speakers in the podcast")
    character_names: List[str] = Field(..., min_items=2, max_items=4, description="List of speaker names")
    expertise_level: ExpertiseLevel = Field(..., description="Target audience expertise level")
    duration_minutes: int = Field(..., ge=5, le=30, description="Duration of the podcast in minutes")
    format_style: FormatStyle = Field(..., description="Style of the podcast format")

class TranscriptEditRequest(BaseModel):
    transcript: str

class PodcastRequest(BaseModel):
    transcript: str = Field(..., min_length=1)
    voiceMappings: Dict[str, VoiceConfig]

class SingleSegmentRequest(BaseModel):
    speaker: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)
    voiceConfig: VoiceConfig

class PodcastConfig(BaseModel):
    duration_options: List[int] = Field(
        default=[5, 10, 15, 20, 30],
        description="Available podcast duration options in minutes"
    )
    speaker_options: List[int] = Field(
        default=[2, 3, 4],
        description="Available number of speakers options"
    )
    expertise_levels: List[ExpertiseLevel] = Field(
        default=list(ExpertiseLevel),
        description="Available expertise levels"
    )
    format_styles: List[FormatStyle] = Field(
        default=list(FormatStyle),
        description="Available podcast format styles"
    ) 