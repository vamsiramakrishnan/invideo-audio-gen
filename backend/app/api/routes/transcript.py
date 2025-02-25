from fastapi import APIRouter, HTTPException
from app.core.models import ConceptRequest, TranscriptEditRequest
from app.services.transcript_generator import TranscriptGenerator

router = APIRouter()
transcript_generator = TranscriptGenerator()

@router.post("/generate-transcript")
async def generate_transcript(request: ConceptRequest):
    try:
        return await transcript_generator.generate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edit-transcript")
async def edit_transcript(request: TranscriptEditRequest):
    try:
        return await transcript_generator.edit(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 