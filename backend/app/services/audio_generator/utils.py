from datetime import datetime
import random
from typing import List

# Word lists for generating unique folder names
ADJECTIVES: List[str] = [
    # Colors and visual qualities
    "azure", "crimson", "golden", "silver", "emerald", "sapphire", "crystal",
    "amber", "obsidian", "platinum", "jade", "cobalt", "scarlet", "ivory",
    
    # Cosmic and natural
    "cosmic", "stellar", "lunar", "solar", "astral", "celestial", "ethereal",
    "nebular", "galactic", "orbital", "aurora", "zenith", "arctic", "tropical",
    
    # Qualities
    "swift", "bold", "grand", "noble", "vital", "prime", "peak",
    "dynamic", "radiant", "vivid", "lucid", "serene", "pristine", "infinite",
    
    # Mystical
    "mystic", "arcane", "mythic", "fabled", "epic", "legendary",
    "ancient", "eternal", "phantom", "cryptic", "enigmatic", "mythical",
    
    # Technical
    "quantum", "cyber", "digital", "sonic", "neural", "vector", "matrix",
    "binary", "atomic", "plasma", "photon", "fusion", "nano", "hyper"
]

NOUNS: List[str] = [
    # Cosmic objects
    "nebula", "quasar", "pulsar", "nova", "cosmos", "galaxy", "star",
    "comet", "meteor", "aurora", "eclipse", "orbit", "void", "horizon",
    
    # Mythical creatures and concepts
    "phoenix", "dragon", "griffin", "titan", "atlas", "oracle", "chimera",
    "hydra", "kraken", "sphinx", "pegasus", "leviathan", "basilisk",
    
    # Geometric/Abstract
    "vertex", "nexus", "prism", "helix", "spiral", "octagon", "matrix",
    "apex", "core", "sphere", "cube", "pyramid", "crystal", "cipher",
    
    # Natural phenomena
    "aurora", "horizon", "zenith", "summit", "storm", "thunder",
    "cascade", "tempest", "vortex", "mirage", "oasis", "delta",
    
    # Technical/Modern
    "cipher", "vector", "beacon", "pulse", "core", "node", "stream",
    "nexus", "matrix", "portal", "reactor", "sensor", "cortex", "grid"
]

def generate_unique_run_id() -> str:
    """
    Generate a unique run ID using random adjective and noun combinations.
    
    Returns:
        str: A unique identifier in the format 'adj1-adj2-noun-timestamp'
    """
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    
    # Get two unique adjectives
    selected_adjectives = random.sample(ADJECTIVES, 2)
    
    # Get one random noun
    selected_noun = random.choice(NOUNS)
    
    # Combine into a unique identifier
    return f"{selected_adjectives[0]}-{selected_adjectives[1]}-{selected_noun}-{timestamp}"

def format_duration(milliseconds: int) -> str:
    """
    Format milliseconds into a human-readable duration string.
    
    Args:
        milliseconds: Duration in milliseconds
        
    Returns:
        str: Formatted duration string (e.g., "2m 30s")
    """
    seconds = milliseconds // 1000
    minutes = seconds // 60
    remaining_seconds = seconds % 60
    
    if minutes > 0:
        return f"{minutes}m {remaining_seconds}s"
    return f"{remaining_seconds}s"

def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename by removing or replacing invalid characters.
    
    Args:
        filename: Original filename
        
    Returns:
        str: Sanitized filename
    """
    # Replace invalid characters with underscores
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    
    # Remove leading/trailing spaces and periods
    filename = filename.strip('. ')
    
    # Ensure filename is not empty
    if not filename:
        filename = "unnamed"
        
    return filename

def chunk_text(text: str, max_length: int = 5000) -> List[str]:
    """
    Split long text into smaller chunks while preserving sentence boundaries.
    
    Args:
        text: Input text to chunk
        max_length: Maximum length of each chunk
        
    Returns:
        List[str]: List of text chunks
    """
    # Split into sentences (basic implementation)
    sentences = text.replace('!', '.').replace('?', '.').split('.')
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        # Add period back to sentence
        sentence = sentence + '.'
        sentence_length = len(sentence)
        
        if current_length + sentence_length > max_length and current_chunk:
            # Save current chunk and start new one
            chunks.append(' '.join(current_chunk))
            current_chunk = [sentence]
            current_length = sentence_length
        else:
            # Add to current chunk
            current_chunk.append(sentence)
            current_length += sentence_length
    
    # Add final chunk if exists
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def get_file_size_str(size_in_bytes: int) -> str:
    """
    Convert file size in bytes to human-readable string.
    
    Args:
        size_in_bytes: File size in bytes
        
    Returns:
        str: Formatted file size (e.g., "1.5 MB")
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_in_bytes < 1024:
            return f"{size_in_bytes:.1f} {unit}"
        size_in_bytes /= 1024
    return f"{size_in_bytes:.1f} TB" 