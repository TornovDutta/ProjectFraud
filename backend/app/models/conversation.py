from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class Message(BaseModel):
    id: str = Field(default_factory=lambda: f"msg_{int(datetime.utcnow().timestamp()*1000)}")
    sender: str # "user" | "assistant" | "system"
    text: str
    audio_url: Optional[str] = None
    language: str = "English" # "English", "Hindi", "Bengali"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    quick_options: Optional[List[str]] = None

class ConversationState(BaseModel):
    complaint_id: str
    user_id: str
    language: str = "English"
    messages: List[Message] = []
    extracted_fields: Dict[str, Any] = {}
    missing_fields: List[str] = []
    is_completed: bool = False
    warning_security: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatMessageInput(BaseModel):
    complaint_id: Optional[str] = None
    message: str
    language: Optional[str] = "English"
    audio_base64: Optional[str] = None
