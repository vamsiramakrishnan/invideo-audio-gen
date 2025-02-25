import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    PROJECT_ID: str = os.getenv("GOOGLE_CLOUD_PROJECT", "vital-octagon-19612")
    UPLOAD_DIR: Path = Path("uploads")
    AUDIO_DIR: Path = Path("podcast_outputs")
    
    # CORS settings
    CORS_ORIGINS: list = ["http://localhost:3000"]
    
    # Create necessary directories
    UPLOAD_DIR.mkdir(exist_ok=True)
    AUDIO_DIR.mkdir(exist_ok=True)

settings = Settings() 