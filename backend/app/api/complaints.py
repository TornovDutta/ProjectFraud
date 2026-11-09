from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import UserResponse
from app.models.complaint import (
    ComplaintCreate, ComplaintUpdate, ComplaintResponse, 
    SubmissionStatus, TrackingStatus
)
from app.services.formal_complaint_gen import FormalComplaintGenerator
from app.services.portal_handoff import GovernmentPortalHandoff

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.get("", response_model=List[ComplaintResponse])
async def list_complaints(current_user: UserResponse = Depends(get_current_user)):
    db = get_db()
    cursor = db["complaints"].find({"user_id": current_user.id}).sort("created_at", -1)
    docs = await cursor.to_list(100)
    
    results = []
    for d in docs:
        results.append(ComplaintResponse(
            id=str(d["_id"]),
            user_id=d.get("user_id", current_user.id),
            fraud_type=d.get("fraud_type"),
            fraud_amount=d.get("fraud_amount"),
            payment_method=d.get("payment_method"),
            incident_date=d.get("incident_date"),
            incident_time=d.get("incident_time"),
            transaction_id=d.get("transaction_id"),
            suspect_phone=d.get("suspect_phone"),
            suspect_upi_id=d.get("suspect_upi_id"),
            suspect_bank_account=d.get("suspect_bank_account"),
            incident_description=d.get("incident_description"),
            submission_status=d.get("submission_status", SubmissionStatus.DRAFT),
            tracking_status=d.get("tracking_status", TrackingStatus.NOT_SUBMITTED),
            government_acknowledgement=d.get("government_acknowledgement"),
            evidence_ids=d.get("evidence_ids", []),
            formal_narrative=d.get("formal_narrative"),
            created_at=d.get("created_at", datetime.utcnow()),
            updated_at=d.get("updated_at", datetime.utcnow())
        ))
    return results

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(complaint_id: str, current_user: UserResponse = Depends(get_current_user)):
    db = get_db()
    doc = await db["complaints"].find_one({"_id": complaint_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    return ComplaintResponse(
        id=str(doc["_id"]),
        user_id=doc.get("user_id", current_user.id),
        fraud_type=doc.get("fraud_type"),
        fraud_amount=doc.get("fraud_amount"),
        payment_method=doc.get("payment_method"),
        incident_date=doc.get("incident_date"),
        incident_time=doc.get("incident_time"),
        transaction_id=doc.get("transaction_id"),
        suspect_phone=doc.get("suspect_phone"),
        suspect_upi_id=doc.get("suspect_upi_id"),
        suspect_bank_account=doc.get("suspect_bank_account"),
        incident_description=doc.get("incident_description"),
        submission_status=doc.get("submission_status", SubmissionStatus.DRAFT),
        tracking_status=doc.get("tracking_status", TrackingStatus.NOT_SUBMITTED),
        government_acknowledgement=doc.get("government_acknowledgement"),
        evidence_ids=doc.get("evidence_ids", []),
        formal_narrative=doc.get("formal_narrative"),
        created_at=doc.get("created_at", datetime.utcnow()),
        updated_at=doc.get("updated_at", datetime.utcnow())
    )

@router.put("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: str, 
    update_data: ComplaintUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_db()
    doc = await db["complaints"].find_one({"_id": complaint_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db["complaints"].update_one({"_id": complaint_id}, {"$set": update_dict})
    updated_doc = await db["complaints"].find_one({"_id": complaint_id})
    
    return ComplaintResponse(
        id=str(updated_doc["_id"]),
        user_id=updated_doc.get("user_id", current_user.id),
        fraud_type=updated_doc.get("fraud_type"),
        fraud_amount=updated_doc.get("fraud_amount"),
        payment_method=updated_doc.get("payment_method"),
        incident_date=updated_doc.get("incident_date"),
        incident_time=updated_doc.get("incident_time"),
        transaction_id=updated_doc.get("transaction_id"),
        suspect_phone=updated_doc.get("suspect_phone"),
        suspect_upi_id=updated_doc.get("suspect_upi_id"),
        suspect_bank_account=updated_doc.get("suspect_bank_account"),
        incident_description=updated_doc.get("incident_description"),
        submission_status=updated_doc.get("submission_status", SubmissionStatus.DRAFT),
        tracking_status=updated_doc.get("tracking_status", TrackingStatus.NOT_SUBMITTED),
        government_acknowledgement=updated_doc.get("government_acknowledgement"),
        evidence_ids=updated_doc.get("evidence_ids", []),
        formal_narrative=updated_doc.get("formal_narrative"),
        created_at=updated_doc.get("created_at", datetime.utcnow()),
        updated_at=updated_doc.get("updated_at", datetime.utcnow())
    )

@router.post("/{complaint_id}/generate-narrative")
async def generate_formal_narrative(
    complaint_id: str, 
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Generates the official formal legal complaint narrative for the government portal.
    """
    db = get_db()
    doc = await db["complaints"].find_one({"_id": complaint_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    narrative = FormalComplaintGenerator.generate(doc, current_user.model_dump())
    
    await db["complaints"].update_one(
        {"_id": complaint_id},
        {"$set": {"formal_narrative": narrative, "submission_status": SubmissionStatus.READY.value}}
    )
    
    return {
        "complaint_id": complaint_id,
        "narrative": narrative,
        "submission_status": SubmissionStatus.READY.value
    }

@router.get("/{complaint_id}/guided-submission")
async def get_guided_submission(
    complaint_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Returns step-by-step guidance and clipboard-ready fields for cybercrime.gov.in.
    """
    db = get_db()
    doc = await db["complaints"].find_one({"_id": complaint_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    packet = GovernmentPortalHandoff.get_guided_submission_packet(doc, current_user.model_dump())
    return packet

@router.post("/{complaint_id}/submit-authorized-api")
async def submit_authorized_api(
    complaint_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Simulates direct submission through authorized government API integration.
    """
    db = get_db()
    doc = await db["complaints"].find_one({"_id": complaint_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    result = GovernmentPortalHandoff.simulate_authorized_submission(complaint_id, doc)
    
    ack_no = result["acknowledgement_number"]
    await db["complaints"].update_one(
        {"_id": complaint_id},
        {
            "$set": {
                "government_acknowledgement": ack_no,
                "submission_status": SubmissionStatus.ACKNOWLEDGED.value,
                "tracking_status": TrackingStatus.BANK_FREEZE_DISPATCHED.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    for update in result["timeline"]:
        update["complaint_id"] = complaint_id
        await db["complaint_updates"].insert_one(update)
        
    return result
