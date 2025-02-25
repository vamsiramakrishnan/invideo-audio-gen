from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from typing import Set
from app.services.websocket_manager import ConnectionManager
from app.services.transcript_generator import TranscriptGenerator
from app.core.models import ConceptRequest, TranscriptEditRequest
from app.core.config import settings

router = APIRouter()
manager = ConnectionManager()
transcript_generator = TranscriptGenerator()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        # Handle CORS for WebSocket
        origin = websocket.headers.get('origin', '')
        if origin not in settings.CORS_ORIGINS:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await manager.connect(websocket)
        
        while True:
            try:
                data = await websocket.receive_json()
                
                if data["type"] == "generate_transcript":
                    request = ConceptRequest(**data["payload"])
                    try:
                        transcript = await transcript_generator.generate(request)
                        await websocket.send_json({
                            "type": "transcript_generated",
                            "payload": transcript
                        })
                    except Exception as e:
                        await websocket.send_json({
                            "type": "error",
                            "payload": str(e)
                        })
                        
                elif data["type"] == "edit_transcript":
                    request = TranscriptEditRequest(**data["payload"])
                    try:
                        result = await transcript_generator.edit(request)
                        await websocket.send_json({
                            "type": "transcript_edited",
                            "payload": result
                        })
                    except Exception as e:
                        await websocket.send_json({
                            "type": "error",
                            "payload": str(e)
                        })
                        
            except WebSocketDisconnect:
                manager.disconnect(websocket)
                break
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "payload": str(e)
                })
                
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass 