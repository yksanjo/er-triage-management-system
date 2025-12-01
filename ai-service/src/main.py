from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv

from services.vital_signs_service import VitalSignsService
from services.triage_service import TriageService

load_dotenv()

app = FastAPI(title="ER Triage AI Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
vital_signs_service = VitalSignsService()
triage_service = TriageService()


class TriageAssessmentRequest(BaseModel):
    chiefComplaint: str
    additionalNotes: Optional[str] = None
    vitalSigns: Optional[Dict[str, Any]] = None


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-service"}


@app.post("/api/vital-signs/extract")
async def extract_vital_signs(video: UploadFile = File(...)):
    """
    Extract vital signs from patient video
    """
    try:
        # Read video file
        video_bytes = await video.read()
        
        # Process video to extract vital signs
        vital_signs = await vital_signs_service.extract_from_video(video_bytes)
        
        return {
            "success": True,
            "vitalSigns": vital_signs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")


@app.post("/api/triage/assess")
async def assess_triage(request: TriageAssessmentRequest):
    """
    Perform AI-powered triage assessment
    """
    try:
        result = await triage_service.assess(
            chief_complaint=request.chiefComplaint,
            additional_notes=request.additionalNotes,
            vital_signs=request.vitalSigns
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in triage assessment: {str(e)}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

