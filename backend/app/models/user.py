from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$", description="10-digit Indian Mobile Number")
    email: Optional[str] = None
    preferred_language: str = Field(default="English", description="Preferred language: English, Hindi, Bengali")

class UserCreate(UserBase):
    password: Optional[str] = "cybersathi_demo_pass"

class UserLogin(BaseModel):
    mobile: str
    password: Optional[str] = None
    otp: Optional[str] = "1234" # Demo OTP support

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)

class UserResponse(UserBase):
    id: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
