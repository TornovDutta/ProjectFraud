from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberSathi - AI-Powered Voice Cyber Fraud Complaint Assistant"
    API_V1_STR: str = "/api/v1"
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "cybersathi_db"
    
    # Security & JWT
    SECRET_KEY: str = "cybersathi-super-secure-production-jwt-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Emergency Helplines & Official Links
    EMERGENCY_HELPLINE: str = "1930"
    OFFICIAL_PORTAL_URL: str = "https://cybercrime.gov.in"
    OFFICIAL_TRACKING_URL: str = "https://www.cybercrime.gov.in/Webform/chkackstatus.aspx"
    
    # AI & Speech Services
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    # File Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
