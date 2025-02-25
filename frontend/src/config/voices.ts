export const VOICE_CONFIGS = {
  'Puck': {
    icon: '🌟',
    color: '#FF6B6B',
    description: 'Playful and energetic voice perfect for dynamic content'
  },
  'Charon': {
    icon: '🌌',
    color: '#4A90E2',
    description: 'Deep and mysterious voice ideal for serious topics'
  },
  'Aoede': {
    icon: '🎵',
    color: '#F39C12',
    description: 'Melodic and musical voice for engaging storytelling'
  },
  'Zephyr': {
    icon: '🌪️',
    color: '#3498DB',
    description: 'Swift and airy voice for energetic content'
  },
  'Leda': {
    icon: '🌙',
    color: '#E74C3C',
    description: 'Graceful and elegant voice for refined delivery'
  },
  'Fenrir': {
    icon: '🐺',
    color: '#9B59B6',
    description: 'Strong and powerful voice for authoritative content'
  },
  'Orus': {
    icon: '☀️',
    color: '#2ECC71',
    description: 'Bright and clear voice for educational content'
  },
  'Kore': {
    icon: '🌸',
    color: '#50E3C2',
    description: 'Soft and gentle voice for calming content'
  }
} as const;

export type VoiceName = keyof typeof VOICE_CONFIGS;

export interface VoiceConfig {
  icon: string;
  color: string;
  description: string;
}

// Voice configuration options matching backend models
export const VOICE_OPTIONS = {
  age: Array.from({ length: 51 }, (_, i) => i + 20), // 20-70 years
  gender: ['male', 'female', 'neutral'] as const,
  voice_tone: ['warm', 'professional', 'energetic', 'calm', 'authoritative'] as const,
  accent: ['neutral', 'british', 'american', 'australian', 'indian'] as const,
  speaking_rate: {
    normal: [100, 200],
    excited: [120, 220],
    analytical: [80, 180]
  },
  voice_characteristics: {
    pitch_range: ['narrow', 'medium', 'wide'],
    resonance: ['chest', 'head', 'mixed'],
    breathiness: ['low', 'medium', 'high'],
    vocal_energy: ['low', 'moderate', 'high'],
    pause_pattern: ['natural', 'dramatic', 'minimal'],
    emphasis_pattern: ['balanced', 'strong', 'subtle'],
    emotional_range: ['neutral', 'expressive', 'highly-expressive'],
    breathing_pattern: ['relaxed', 'controlled', 'dynamic']
  },
  speech_patterns: {
    phrasing: ['natural', 'structured', 'flowing'],
    rhythm: ['regular', 'varied', 'dynamic'],
    articulation: ['clear', 'precise', 'relaxed'],
    modulation: ['subtle', 'moderate', 'dramatic']
  },
  persona: [
    'Podcast Host',
    'Expert Speaker',
    'Storyteller',
    'News Anchor',
    'Teacher',
    'Conversational Speaker'
  ],
  background: [
    'Experienced in the topic',
    'Subject matter expert',
    'Professional broadcaster',
    'Industry specialist',
    'Casual enthusiast'
  ]
} as const; 