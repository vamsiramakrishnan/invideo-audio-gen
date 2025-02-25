# invideo-audio-gen

A modern web application for generating high-quality audio content with customizable voice configurations, built with FastAPI and React. The system leverages Google's Gemini AI platform for advanced voice synthesis and natural language processing.

## Features

- Real-time audio generation with progress tracking via Server-Sent Events (SSE)
- Customizable voice configurations for multiple speakers
- Advanced voice characteristic controls:
  - Speaking rate adjustment (normal, excited, analytical modes)
  - Voice characteristics (pitch, resonance, breathiness, vocal energy)
  - Speech patterns (phrasing, rhythm, emphasis)
  - Emotional range and breathing pattern customization
- Support for multi-speaker transcripts with speaker detection
- Modern React-based user interface with Tailwind CSS
- Real-time progress updates and error handling
- Downloadable audio segments in multiple formats

## Available Voices

The system offers 8 distinct AI voices, each optimized for different content types:

| Voice    | Description                                        | Best For                |
|----------|----------------------------------------------------|------------------------|
| Puck   | Playful and energetic voice                       | Dynamic content        |
| Charon | Deep and mysterious voice                         | Serious topics         |
| Aoede  | Melodic and musical voice                         | Engaging storytelling  |
| Zephyr | Swift and airy voice                              | Energetic content      |
| Leda   | Graceful and elegant voice                        | Refined delivery       |
| Fenrir | Strong and powerful voice                         | Authoritative content  |
| Orus   | Bright and clear voice                            | Educational content    |
| Kore   | Soft and gentle voice                             | Calming content        |

## Project Structure

### Frontend (`/frontend`)
- Built with React, TypeScript, and Tailwind CSS
- Key components:
  - `src/components/AudioGenerationSection.tsx`: Main audio generation interface
  - `src/components/VoiceConfigurationManager.tsx`: Voice settings management
  - `src/hooks/useAudioGeneration.ts`: Audio generation state management
  - `src/types/audio.ts`: TypeScript interfaces for audio generation
  - `src/config/voices.ts`: Voice configuration and options

### Backend (`/backend`)
- Built with FastAPI and Python
- Key components:
  - `app/api/routes/audio.py`: Audio generation endpoints
  - `app/services/audio_generator.py`: Core audio generation logic
  - `app/core/models.py`: Data models and request schemas

## System Requirements

### Backend Requirements
- Python 3.9 or higher
- FastAPI 0.68.0+
- Google Cloud AI Platform access
- Required Python packages:
  - fastapi
  - uvicorn
  - pydantic
  - google-cloud-aiplatform
  - python-dotenv
  - pydub

### Frontend Requirements
- Node.js 14.0 or higher
- npm or yarn package manager
- Modern web browser with SSE support

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/invideo-audio-gen.git
cd invideo-audio-gen
```

2. Set up the backend:
```bash
cd backend
# Set up Python virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Set up environment variables
cp .env.example .env
# Edit .env with your Google Cloud credentials
python run.py
```

3. Set up the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Access the web interface at `http://localhost:3000`
2. Upload or paste your transcript with speaker annotations
3. Configure voice settings for each speaker:
   - Select a voice type from the available options
   - Adjust voice characteristics (pitch, resonance, etc.)
   - Fine-tune speaking rate and emotional range
   - Preview voice settings
4. Generate audio and monitor progress in real-time
5. Download the generated audio segments

## API Documentation

The backend API provides the following endpoints:

- `POST /api/generate-audio`: Generate audio from transcript
  - Request body: `PodcastRequest` containing transcript and voice mappings
  - Returns: Server-Sent Events with generation progress

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and formatting
- Add appropriate tests for new features
- Update documentation for any changes
- Ensure all tests pass before submitting PR

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Cloud AI Platform for voice synthesis
- FastAPI for the backend framework
- React and Tailwind CSS for the frontend
