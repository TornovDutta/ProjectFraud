from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.models.user import UserResponse
from app.models.complaint import SubmissionStatus, TrackingStatus

router = APIRouter(prefix="/tracking", tags=["Complaint Tracking"])

class AcknowledgementInput(BaseModel):
    complaint_id: str
    acknowledgement_number: str

@router.get("/status/{identifier}")
async def get_tracking_status(identifier: str):
    """
    Retrieves complaint tracking status either by CyberSathi complaint_id or government acknowledgement_number.
    """
    db = get_db()
    
    # Try finding by complaint_id
    doc = await db["complaints"].find_one({"_id": identifier})
    if not doc:
        # Try finding by government acknowledgement
        doc = await db["complaints"].find_one({"government_acknowledgement": identifier})
        
    if not doc:
        # Return official tracking portal redirect info
        return {
            "found": False,
            "message": f"Acknowledgement number {identifier} not found in local cache.",
            "official_portal_url": settings.OFFICIAL_TRACKING_URL,
            "instruction": "You can check status directly on the official cybercrime portal using the link provided."
        }
        
    complaint_id = str(doc["_id"])
    updates_cursor = db["complaint_updates"].find({"complaint_id": complaint_id}).sort("timestamp", 1)
    updates = await updates_cursor.to_list(50)
    
    # If no updates yet, synthesize baseline timeline
    timeline = []
    if updates:
        timeline = updates
    else:
        created_time = doc.get("created_at", datetime.utcnow())
        timeline.append({
            "status": doc.get("submission_status", "DRAFT"),
            "title": "Complaint Initiated in CyberSathi",
            "description": "Information collected via AI Voice Assistant.",
            "source": "CITIZEN",
            "timestamp": created_time.isoformat() if hasattr(created_time, 'isoformat') else str(created_time)
        })
        if doc.get("government_acknowledgement"):
            timeline.append({
                "status": "ACKNOWLEDGED",
                "title": "Government Acknowledgement Assigned",
                "description": f"Official Reference: {doc.get('government_acknowledgement')}",
                "source": "OFFICIAL_PORTAL",
                "timestamp": doc.get("updated_at", datetime.utcnow()).isoformat()
            })
            
    return {
        "found": True,
        "complaint_id": complaint_id,
        "fraud_type": doc.get("fraud_type"),
        "fraud_amount": doc.get("fraud_amount"),
        "submission_status": doc.get("submission_status"),
        "tracking_status": doc.get("tracking_status"),
        "government_acknowledgement": doc.get("government_acknowledgement"),
        "official_tracking_url": settings.OFFICIAL_TRACKING_URL,
        "timeline": timeline
    }

@router.post("/attach-acknowledgement")
async def attach_acknowledgement(
    data: AcknowledgementInput,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Allows the citizen to enter their official government acknowledgement number
    after submitting manually on cybercrime.gov.in.
    """
    db = get_db()
    complaint_doc = await db["complaints"].find_one({"_id": data.complaint_id})
    if not complaint_doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    now = datetime.utcnow()
    await db["complaints"].update_one(
        {"_id": data.complaint_id},
        {
            "$set": {
                "government_acknowledgement": data.acknowledgement_number,
                "submission_status": SubmissionStatus.ACKNOWLEDGED.value,
                "tracking_status": TrackingStatus.SUBMITTED_TO_PORTAL.value,
                "updated_at": now
            }
        }
    )
    
    # Insert update record
    update_event = {
        "complaint_id": data.complaint_id,
        "status": TrackingStatus.SUBMITTED_TO_PORTAL.value,
        "title": "Government Acknowledgement Attached",
        "description": f"Citizen linked Acknowledgement No: {data.acknowledgement_number}. Tracking active.",
        "source": "CITIZEN",
        "timestamp": now.isoformat()
    }
    await db["complaint_updates"].insert_one(update_event)
    
    return {
        "success": True,
        "message": "Acknowledgement number linked successfully",
        "complaint_id": data.complaint_id,
        "acknowledgement_number": data.acknowledgement_number
    }
