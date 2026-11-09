from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/emergency", tags=["Emergency 1930 Helpline"])

BANK_HELPLINES = [
    {"bank": "State Bank of India (SBI)", "phone": "1800111109", "block_sms": "BLOCK <last 4 digits> to 567676"},
    {"bank": "HDFC Bank", "phone": "18001600 / 18002600", "block_sms": "NetBanking -> Deactivate Card"},
    {"bank": "ICICI Bank", "phone": "18001080", "block_sms": "iMobile -> Quick Lock"},
    {"bank": "Axis Bank", "phone": "18604195555", "block_sms": "BLOCKCARD to 5676782"},
    {"bank": "Punjab National Bank (PNB)", "phone": "18001802222", "block_sms": "HOT <Card No> to 5607040"},
    {"bank": "Bank of Baroda", "phone": "18005700", "block_sms": "BOB Card -> Lock"},
    {"bank": "Kotak Mahindra Bank", "phone": "18602662666", "block_sms": "KOTAK App -> Service Requests"}
]

@router.get("/helpline-info")
async def get_emergency_info():
    return {
        "emergency_number": settings.EMERGENCY_HELPLINE,
        "service_name": "Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS)",
        "national_portal_url": settings.OFFICIAL_PORTAL_URL,
        "operating_hours": "24x7 Active",
        "description": "If you lost money within the last 2-24 hours ('The Golden Hour'), calling 1930 immediately triggers automated inter-bank communication to freeze the fraudster's beneficiary account before money is withdrawn.",
        "golden_hour_steps": [
            {
                "step": 1,
                "title": "Call 1930 Immediately",
                "action": "tel:1930",
                "detail": "Dial 1930 from your phone to connect with the National Cyber Crime Cell."
            },
            {
                "step": 2,
                "title": "Notify Your Bank to Block Channel",
                "action": "call_bank",
                "detail": "Call your bank's toll-free fraud helpline to block UPI / NetBanking / Debit Card."
            },
            {
                "step": 3,
                "title": "Keep Transaction Details Ready",
                "action": "note_details",
                "detail": "Have your 12-digit UPI UTR number, date, time, and debit SMS ready."
            },
            {
                "step": 4,
                "title": "File Official Complaint",
                "action": "open_portal",
                "detail": "CyberSathi prepares your formal complaint for cybercrime.gov.in."
            }
        ],
        "bank_helplines": BANK_HELPLINES
    }
