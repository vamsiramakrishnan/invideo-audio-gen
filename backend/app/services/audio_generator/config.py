# Voice and speaker configurations
VOICE_CONFIGS = {
    "Puck": {
        "icon": "🌟",
        "color": "#FF6B6B",
        "description": "Playful and energetic voice"
    },
    "Charon": {
        "icon": "🌌",
        "color": "#4A90E2",
        "description": "Deep and mysterious voice"
    },
    "Aoede": {
        "icon": "🎵",
        "color": "#F39C12",
        "description": "Melodic and musical voice"
    },
    "Zephyr": {
        "icon": "🌪️",
        "color": "#3498DB",
        "description": "Swift and airy voice"
    },
    "Fenrir": {
        "icon": "🐺",
        "color": "#8E44AD",
        "description": "Powerful and commanding voice"
    },
    "Leda": {
        "icon": "🕊️",
        "color": "#2ECC71",
        "description": "Gentle and soothing voice"
    },
    "Orus": {
        "icon": "🦉",
        "color": "#E67E22",
        "description": "Wise and authoritative voice"
    },
    "Kore": {
        "icon": "🌸",
        "color": "#E84393",
        "description": "Youthful and vibrant voice"
    }
}

SPEAKER_CONFIG_OPTIONS = {
    "age": list(range(20, 71, 5)),
    "gender": ["Male", "Female", "Non-binary"],
    "voice_tone": [
        "deep, resonant baritone",
        "light, airy soprano",
        "warm, rich mezzo",
        "energetic, dynamic tenor",
        "smooth, mellow alto"
    ],
    "accent": [
        "British-Indian",
        "American",
        "British",
        "Australian",
        "Neutral",
        "Indian"
    ],
    "speaking_rate": {
        "normal": list(range(120, 161, 10)),
        "excited": list(range(140, 181, 10)),
        "analytical": list(range(100, 141, 10))
    }
} 