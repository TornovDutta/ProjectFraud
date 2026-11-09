from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional, Dict, Any, List
from datetime import datetime
import os
import shutil
from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.models.user import UserResponse
from app.models.evidence import EvidenceResponse
from app.services.ocr_service import OCREvidenceService

router = APIRouter(prefix="/evidence", tags=["Evidence & OCR Analysis"])

@router.post("/upload", response_model=EvidenceResponse)
async def upload_evidence(
    complaint_id: str = Form(...),
    file: UploadFile = File(...),
    text_hint: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Uploads supporting evidence (screenshot or payment receipt) and runs AI extraction.
    """
    db = get_db()
    complaint_doc = await db["complaints"].find_one({"_id": complaint_id})
    if not complaint_doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    evidence_id = f"evd_{int(datetime.utcnow().timestamp()*1000)}"
    file_ext = os.path.splitext(file.filename or "")[1] or ".png"
    saved_filename = f"{evidence_id}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, saved_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Run OCR Service
    extracted = OCREvidenceService.process_evidence_file(file_path, text_hint)
    
    evidence_doc = {
        "_id": evidence_id,
        "complaint_id": complaint_id,
        "file_name": file.filename,
        "file_type": file.content_type or "image/png",
        "file_path": file_path,
        "extracted_data": extracted,
        "uploaded_at": datetime.utcnow()
    }
    await db["evidences"].insert_one(evidence_doc)
    
    # Link to complaint and auto-fill if complaint missing transaction details
    complaint_update: Dict[str, Any] = {
        "updated_at": datetime.utcnow()
    }
    if extracted.get("utr_number") and not complaint_doc.get("transaction_id"):
        complaint_update["transaction_id"] = extracted["utr_number"]
    if extracted.get("amount") and not complaint_doc.get("fraud_amount"):
        complaint_update["fraud_amount"] = extracted["amount"]
    if extracted.get("beneficiary_vpa") and not complaint_doc.get("suspect_upi_id"):
        complaint_update["suspect_upi_id"] = extracted["beneficiary_vpa"]
        
    await db["complaints"].update_one(
        {"_id": complaint_id},
        {
            "$set": complaint_update,
            "$push": {"evidence_ids": evidence_id}
        }
    )
    
    return EvidenceResponse(
        id=evidence_id,
        complaint_id=complaint_id,
        file_name=file.filename or "receipt.png",
        file_type=file.content_type or "image/png",
        file_path=file_path,
        extracted_data=extracted,
        uploaded_at=evidence_doc["uploaded_at"]
    )

@router.get("/complaint/{complaint_id}", response_model=List[EvidenceResponse])
async def list_evidences_for_complaint(complaint_id: str):
    db = get_db()
    cursor = db["evidences"].find({"complaint_id": complaint_id})
    docs = await cursor.to_list(50)
    
    results = []
    for d in docs:
        results.append(EvidenceResponse(
            id=str(d["_id"]),
            complaint_id=d.get("complaint_id", complaint_id),
            file_name=d.get("file_name", "evidence.png"),
            file_type=d.get("file_type", "image/png"),
            file_path=d.get("file_path", ""),
            extracted_data=d.get("extracted_data"),
            uploaded_at=d.get("uploaded_at", datetime.utcnow())
        ))
    return results
