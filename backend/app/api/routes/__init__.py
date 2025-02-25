from fastapi import APIRouter
from .transcript import router as transcript_router
from .audio import router as audio_router
from .websocket import router as websocket_router
from .config import router as config_router

router = APIRouter()

router.include_router(transcript_router, tags=["transcript"])
router.include_router(audio_router, tags=["audio"])
router.include_router(websocket_router, tags=["websocket"])
router.include_router(config_router, tags=["config"]) 