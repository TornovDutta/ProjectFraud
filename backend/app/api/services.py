from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.services.fraud_scanner import FraudRiskScanner
from app.services.citizen_services import CitizenServices

router = APIRouter(prefix="/services", tags=["Citizen Cyber Services"])

class ScanRequest(BaseModel):
    query: str
    query_type: Optional[str] = "AUTO" # "AUTO", "PHONE", "UPI", "URL", "TEXT"

class RbiClaimRequest(BaseModel):
    complainant_name: str
    bank_name: str
    account_or_card_last4: str
    fraud_amount: float
    transaction_date: str
    report_date: str
    transaction_id_utr: Optional[str] = "Pending Audit"
    cybercrime_ack_no: Optional[str] = "Under 1930 Lodgement"

@router.post("/fraud-scanner")
async def scan_fraud_risk(payload: ScanRequest):
    """
    Scans a suspicious Phone Number, UPI ID, Link/URL, or SMS text
    against active cyber fraud patterns and modus operandi in India.
    """
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    result = FraudRiskScanner.scan_input(payload.query, payload.query_type)
    return result

@router.post("/rbi-ombudsman-claim")
async def generate_rbi_claim(payload: RbiClaimRequest):
    """
    Generates a formal legal claim petition for 100% refund under
    RBI Circular DBR.No.Leg.BC.78/09.07.005/2017-18 (Zero Liability Framework).
    """
    result = CitizenServices.generate_rbi_zero_liability_claim(
        complainant_name=payload.complainant_name,
        bank_name=payload.bank_name,
        account_or_card_last4=payload.account_or_card_last4,
        fraud_amount=payload.fraud_amount,
        transaction_date=payload.transaction_date,
        report_date=payload.report_date,
        transaction_id_utr=payload.transaction_id_utr or "Pending Audit",
        cybercrime_ack_no=payload.cybercrime_ack_no or "Under 1930 Lodgement"
    )
    return result

@router.get("/sanchar-saathi")
async def get_sanchar_saathi():
    """
    Returns guidance and official links for Sanchar Saathi, CEIR (IMEI blocking),
    and TAFCOP (Aadhaar SIM verification).
    """
    return CitizenServices.get_sanchar_saathi_services()

@router.get("/quick-actions")
async def get_quick_actions():
    """
    Returns offline USSD codes (*99*99#) and SMS emergency card freeze templates.
    """
    return CitizenServices.get_emergency_quick_actions()

@router.get("/trending-scams")
async def get_trending_scams():
    """
    Returns recent high-risk cyber scam bulletins and prevention guidelines in India.
    """
    return CitizenServices.get_trending_scams()
