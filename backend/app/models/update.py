from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ComplaintUpdateEvent(BaseModel):
    id: str = Field(default_factory=lambda: f"upd_{int(datetime.utcnow().timestamp()*1000)}")
    complaint_id: str
    status: str
    title: str
    description: str
    source: str = "OFFICIAL_PORTAL" # "CITIZEN", "CYBER_CELL", "OFFICIAL_PORTAL", "BANK"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
