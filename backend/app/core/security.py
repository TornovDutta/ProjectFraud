import re
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Sensitive data patterns that should NEVER be stored or asked
PIN_PATTERNS = [
    r'\b(?:pin|mpin|upi\s*pin|atm\s*pin)\s*(?:is|:|=)?\s*([0-9]{4,6})\b',
    r'\b(?:otp|one\s*time\s*password)\s*(?:is|:|=)?\s*([0-9]{4,8})\b',
    r'\b(?:password|pwd)\s*(?:is|:|=)?\s*([^\s]{4,20})\b',
    r'\b(?:cvv|cvc)\s*(?:is|:|=)?\s*([0-9]{3,4})\b',
]

def sanitize_sensitive_data(text: str) -> Tuple[str, bool, str]:
    """
    Scans for sensitive financial secrets (PIN, OTP, CVV, passwords).
    Redacts them if present and returns (clean_text, was_sensitive_detected, warning_message)
    """
    if not text:
        return text, False, ""
    
    clean_text = text
    detected = False
    warning = ""
    
    for pattern in PIN_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            detected = True
            secret = match.group(1)
            # Redact the actual secret digits/characters
            clean_text = clean_text.replace(secret, "[REDACTED_SECURITY_DATA]")
            warning = (
                "SECURITY ALERT: Never share your UPI PIN, ATM PIN, OTP, or Banking Password. "
                "CyberSathi has automatically removed this sensitive data to protect your account. "
                "Police and Cyber Cells will NEVER ask for your PIN or OTP."
            )
            
    return clean_text, detected, warning

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception:
        # Fallback if bcrypt native module has issue
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
