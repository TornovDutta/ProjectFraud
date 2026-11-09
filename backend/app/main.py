from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from app.core.config import settings
from app.core.database import db_manager
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.complaints import router as complaints_router
from app.api.evidence import router as evidence_router
from app.api.tracking import router as tracking_router
from app.api.emergency import router as emergency_router
from app.api.services import router as services_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("cybersathi")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CyberSathi Backend...")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    await db_manager.connect()
    yield
    logger.info("Shutting down CyberSathi Backend...")
    await db_manager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for CyberSathi: AI-Powered Voice Cyber Fraud Complaint Assistant for Indian Citizens.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React Native Web & mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(evidence_router, prefix=settings.API_V1_STR)
app.include_router(tracking_router, prefix=settings.API_V1_STR)
app.include_router(emergency_router, prefix=settings.API_V1_STR)
app.include_router(services_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": "CyberSathi API",
        "status": "Online",
        "emergency_helpline": "1930",
        "official_portal": "https://cybercrime.gov.in",
        "documentation": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "fallback_store" if db_manager.is_fallback else "mongodb_connected",
        "version": "1.0.0"
    }
