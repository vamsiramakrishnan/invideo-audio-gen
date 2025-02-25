from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from app.core.models import PodcastRequest
from app.services.audio_generator import AudioGenerator
import json

router = APIRouter()
audio_generator = AudioGenerator()

def format_sse(data: dict, event: str = None) -> str:
    """Format data as SSE message"""
    msg = f"data: {json.dumps(data)}\n"
    if event is not None:
        msg = f"event: {event}\n{msg}"
    return f"{msg}\n"

@router.post("/generate-audio")
async def generate_audio(
    request: PodcastRequest = Body(
        ...,
        example={
            "transcript": "Speaker1: Hello\nSpeaker2: Hi there",
            "voiceMappings": {
                "Speaker1": {
                    "voice": "Puck",
                    "config": {
                        "name": "Speaker1",
                        "age": 30,
                        "gender": "Male",
                        "persona": "Podcast Host",
                        "background": "Experienced host",
                        "voice_tone": "Warm",
                        "accent": "American",
                        "speaking_rate": {
                            "normal": 150,
                            "excited": 170,
                            "analytical": 130
                        },
                        "voice_characteristics": {
                            "pitch_range": "Medium",
                            "resonance": "Balanced",
                            "breathiness": "Low",
                            "vocal_energy": "Medium",
                            "pause_pattern": "Natural",
                            "emphasis_pattern": "Standard",
                            "emotional_range": "Balanced",
                            "breathing_pattern": "Natural"
                        },
                        "speech_patterns": {
                            "phrasing": "Natural",
                            "rhythm": "Steady",
                            "articulation": "Clear",
                            "modulation": "Standard"
                        }
                    }
                }
            }
        }
    )
):
    """Generate audio from transcript using voice configurations with progress streaming."""
    
    async def generate():
        try:
            async for update in audio_generator.generate(request.dict()):
                yield format_sse(update, event=update["type"]).encode("utf-8")
        except Exception as e:
            error_response = {
                "type": "error",
                "stage": "generation_failed",
                "error": str(e)
            }
            yield format_sse(error_response, event="error").encode("utf-8")
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no"
        }
    )