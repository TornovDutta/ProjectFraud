from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class EvidenceBase(BaseModel):
    complaint_id: str
    file_name: str
    file_type: str # "image/png", "image/jpeg", "application/pdf"
    file_path: str
    extracted_data: Optional[Dict[str, Any]] = None

class EvidenceCreate(EvidenceBase):
    pass

class EvidenceInDB(EvidenceBase):
    id: str = Field(alias="_id")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(populate_by_name=True)

class EvidenceResponse(EvidenceBase):
    id: str
    uploaded_at: datetime
