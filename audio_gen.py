"""
Podcast Creator: Generate audio podcasts from transcripts using Google AI's Gemini 2.0
"""

from IPython.display import display, Audio, HTML
import base64
import datetime
import time
import ipywidgets as widgets
import re 
from google import genai
from google.genai.types import (
    Content,
    GenerateContentConfig,
    Part,
    SpeechConfig,
    VoiceConfig,
    PrebuiltVoiceConfig,
)
from pydub import AudioSegment
from pydub.playback import play
import io
import wave
import numpy as np
import os
import json
import random
from typing import List, Tuple, Optional, Dict
from pathlib import Path

# Word lists for generating unique folder names
ADJECTIVES = [
    # Colors and visual qualities
    "azure", "crimson", "golden", "silver", "emerald", "sapphire", "crystal",
    # Cosmic and natural
    "cosmic", "stellar", "lunar", "solar", "astral", "celestial", "ethereal",
    # Qualities
    "swift", "bold", "grand", "noble", "vital", "prime", "peak",
    # Mystical
    "mystic", "arcane", "mythic", "fabled", "epic", "legendary",
    # Technical
    "quantum", "cyber", "digital", "sonic", "neural", "vector", "matrix"
]

NOUNS = [
    # Cosmic objects
    "nebula", "quasar", "pulsar", "nova", "cosmos", "galaxy", "star",
    # Mythical creatures
    "phoenix", "dragon", "griffin", "titan", "atlas", "oracle",
    # Geometric
    "vertex", "nexus", "prism", "helix", "spiral", "octagon", "matrix",
    # Natural phenomena
    "aurora", "horizon", "zenith", "summit", "storm", "thunder",
    # Technical/Modern
    "cipher", "vector", "beacon", "pulse", "core", "node", "stream"
]

class PodcastCreator:
    def __init__(self, project_id: str, config_path: str, location: str = "us-central1", model_id: str = "gemini-2.0-flash-exp"):
        """
        Initialize the PodcastCreator with Google AI client configuration and speaker configs.
        """
        self.project_id = project_id
        self.location = location
        self.model_id = model_id
        self.client = genai.Client(vertexai=True, project=project_id, location=location)
        
        # Load speaker configurations from JSON
        with open(config_path, 'r') as f:
            self.speaker_configs = json.load(f)
            
        # Generate unique run ID using words
        self.run_id = self.generate_unique_run_id()
        
        # Create voice mapping from speaker configs
        self.voice_mapping = {}
        for speaker, config in self.speaker_configs.items():
            style_prompt = (
                f"You are a {config['gender']} {config['persona']} with a {config['voice_tone']} voice. "
                f"You are {config['age']} years old. {config['background']} "
                f"Your accent is {config['accent']}. "
                f"Speaking rate varies: {config['speaking_rate']['normal']} words/min normally, "
                f"{config['speaking_rate']['excited']} words/min when excited, and "
                f"{config['speaking_rate']['analytical']} words/min during analysis. "
                f"Voice characteristics: {config['voice_characteristics']['pitch_range']}. "
                f"You speak with {config['voice_characteristics']['resonance']} and "
                f"{config['voice_characteristics']['breathiness']}. "
                f"Your vocal energy is {config['voice_characteristics']['vocal_energy']}, with "
                f"{config['voice_characteristics']['pause_pattern']}. "
                f"You {config['voice_characteristics']['emphasis_pattern']} and your emotional range spans "
                f"{config['voice_characteristics']['emotional_range']}. "
                f"Breathing pattern: {config['voice_characteristics']['breathing_pattern']}. "
                f"Speech style: {config['speech_patterns']['phrasing']}, with {config['speech_patterns']['rhythm']}. "
                f"Your articulation is {config['speech_patterns']['articulation']} and "
                f"you {config['speech_patterns']['modulation']}."
            )
            self.voice_mapping[speaker] = {
                "voice": config.get("voice", "Puck"),  # Default to Puck if not specified
                "style": style_prompt
            }
        
        # Audio processing settings
        self.crossfade_duration = 1000  # milliseconds
        self.silence_duration = 500  # milliseconds
        self.background_music_volume = -20  # dB
        self.turn_delay = 30  # seconds
        
        # Create base output directory
        self.output_dir = Path("podcast_outputs")
        self.output_dir.mkdir(exist_ok=True)
        
        # Create run-specific directory with unique name
        self.run_dir = self.output_dir / self.run_id
        self.run_dir.mkdir(exist_ok=True)
        
        # Create segments directory within run directory
        self.segments_dir = self.run_dir / "segments"
        self.segments_dir.mkdir(exist_ok=True)
        
        print(f"Created new podcast session: {self.run_id}")
        
    def generate_unique_run_id(self) -> str:
        """
        Generate a unique run ID using random adjective and noun combination.
        """
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        
        # Get two unique adjectives and one noun
        adj1, adj2 = random.sample(ADJECTIVES, 2)
        noun = random.choice(NOUNS)
        
        # Format: adj1-adj2-noun-timestamp
        return f"{adj1}-{adj2}-{noun}-{timestamp}"
    
    def get_relative_path(self, full_path: Path) -> str:
        """
        Convert absolute path to relative path from output directory.
        """
        try:
            return str(full_path.relative_to(self.output_dir))
        except ValueError:
            return str(full_path)
    
    def parse_transcript(self, transcript_path: str) -> List[Tuple[str, str]]:
        """
        Parse transcript file and return list of (speaker, text) tuples.
        """
        dialogue = []
        
        with open(transcript_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        segments = re.split(r'([A-Za-z]+):\s+', content)[1:]
        
        for i in range(0, len(segments), 2):
            if i + 1 < len(segments):
                speaker = segments[i]
                text = segments[i + 1].strip()
                dialogue.append((speaker, text))
        
        return dialogue
    
    def save_audio_segment(self, audio_data: bytes, speaker: str, turn_number: int, mime_type: str) -> str:
        """
        Save individual audio segment and return the file path.
        """
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"audio_{speaker}_{turn_number}_{timestamp}.wav"
        filepath = self.segments_dir / filename
        
        # Save the raw audio data
        with open(filepath, 'wb') as f:
            f.write(audio_data)
            
        return str(filepath)
    
    def generate_audio_segment(self, speaker: str, text: str, turn_number: int, max_retries: int = 3) -> Tuple[AudioSegment, str]:
        """
        Generate audio for a single dialogue segment and save it.
        """
        generate_content_config = GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=SpeechConfig(
                voice_config=VoiceConfig(
                    prebuilt_voice_config=PrebuiltVoiceConfig(
                        voice_name=self.voice_mapping[speaker]["voice"],
                    )
                )
            )
        )
        
        retries = 0
        base_delay = 1  # Start with 1 second delay
        max_delay = 32  # Maximum delay in seconds
        
        while retries < max_retries:
            try:
                print(f"\nAttempt {retries + 1} of {max_retries} for {speaker} (Turn {turn_number})")
                
                response = self.client.models.generate_content(
                    model=self.model_id,
                    contents=[
                        Part(text=self.voice_mapping[speaker]["style"]),
                        Part(text=text),
                    ],
                    config=generate_content_config,
                )
                
                print(f"Response metadata for {speaker} (Turn {turn_number}):")
                print(f"Model used: {self.model_id}")
                print(f"Voice configuration: {self.voice_mapping[speaker]['voice']}")
                
                # Calculate delay for next retry if needed
                delay = min(max_delay, base_delay * (2 ** retries))
                jitter = delay * 0.1 * np.random.random()  # Add 0-10% jitter
                
                if not response.candidates:
                    print(f"Warning: No candidates in response (Attempt {retries + 1})")
                    retries += 1
                    if retries < max_retries:
                        print(f"Retrying in {delay:.1f} seconds (with jitter)...")
                        time.sleep(delay + jitter)
                        continue
                    raise ValueError(f"No candidates in response for {speaker} after {max_retries} attempts")
                