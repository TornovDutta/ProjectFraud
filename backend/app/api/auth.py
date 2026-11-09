from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token, get_password_hash, verify_password
from app.models.user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> UserResponse:
    if not token:
        # Generic citizen session if no explicit token passed
        return UserResponse(
            id="citizen_session",
            name="Citizen",
            mobile="9000000000",
            email=None,
            preferred_language="English",
            created_at=datetime.utcnow()
        )
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )
    
    db = get_db()
    user_doc = await db["users"].find_one({"_id": payload.get("sub")})
    if not user_doc:
        return UserResponse(
            id=payload.get("sub", "user_1"),
            name=payload.get("name", "Citizen"),
            mobile=payload.get("mobile", "9876543210"),
            preferred_language=payload.get("lang", "English"),
            created_at=datetime.utcnow()
        )
        
    return UserResponse(
        id=str(user_doc["_id"]),
        name=user_doc.get("name", ""),
        mobile=user_doc.get("mobile", ""),
        email=user_doc.get("email"),
        preferred_language=user_doc.get("preferred_language", "English"),
        created_at=user_doc.get("created_at", datetime.utcnow())
    )

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate):
    db = get_db()
    existing = await db["users"].find_one({"mobile": user_in.mobile})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
        
    user_id = f"usr_{int(datetime.utcnow().timestamp()*1000)}"
    user_dict = {
        "_id": user_id,
        "name": user_in.name,
        "mobile": user_in.mobile,
        "email": user_in.email,
        "preferred_language": user_in.preferred_language,
        "hashed_password": get_password_hash(user_in.password or "default_pass"),
        "created_at": datetime.utcnow()
    }
    await db["users"].insert_one(user_dict)
    
    token = create_access_token({"sub": user_id, "mobile": user_in.mobile, "name": user_in.name, "lang": user_in.preferred_language})
    user_resp = UserResponse(
        id=user_id,
        name=user_in.name,
        mobile=user_in.mobile,
        email=user_in.email,
        preferred_language=user_in.preferred_language,
        created_at=user_dict["created_at"]
    )
    return Token(access_token=token, token_type="bearer", user=user_resp)

@router.post("/login", response_model=Token)
async def login(login_in: UserLogin):
    db = get_db()
    user_doc = await db["users"].find_one({"mobile": login_in.mobile})
    
    if not user_doc:
        # Auto-create user for instant OTP experience
        user_id = f"usr_{int(datetime.utcnow().timestamp()*1000)}"
        user_doc = {
            "_id": user_id,
            "name": f"Citizen {login_in.mobile[-4:]}",
            "mobile": login_in.mobile,
            "preferred_language": "English",
            "hashed_password": get_password_hash("default_pass"),
            "created_at": datetime.utcnow()
        }
        await db["users"].insert_one(user_doc)
        
    user_id = str(user_doc["_id"])
    token = create_access_token({
        "sub": user_id, 
        "mobile": user_doc.get("mobile", ""), 
        "name": user_doc.get("name", "Citizen"),
        "lang": user_doc.get("preferred_language", "English")
    })
    
    user_resp = UserResponse(
        id=user_id,
        name=user_doc.get("name", "Citizen"),
        mobile=user_doc.get("mobile", login_in.mobile),
        email=user_doc.get("email"),
        preferred_language=user_doc.get("preferred_language", "English"),
        created_at=user_doc.get("created_at", datetime.utcnow())
    )
    return Token(access_token=token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user
