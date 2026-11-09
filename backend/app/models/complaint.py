from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class SubmissionStatus(str, Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    SUBMITTED = "SUBMITTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"

class TrackingStatus(str, Enum):
    NOT_SUBMITTED = "NOT_SUBMITTED"
    SUBMITTED_TO_PORTAL = "SUBMITTED_TO_PORTAL"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    BANK_FREEZE_DISPATCHED = "BANK_FREEZE_DISPATCHED"
    LIEN_MARKED = "LIEN_MARKED"
    FIR_REGISTERED = "FIR_REGISTERED"
    RESOLVED = "RESOLVED"

class FraudType(str, Enum):
    UPI_FRAUD = "UPI_FRAUD"
    PHISHING = "PHISHING"
    OTP_SCAM = "OTP_SCAM"
    FAKE_CUSTOMER_CARE = "FAKE_CUSTOMER_CARE"
    JOB_INVESTMENT_SCAM = "JOB_INVESTMENT_SCAM"
    CREDIT_DEBIT_CARD_FRAUD = "CREDIT_DEBIT_CARD_FRAUD"
    LOAN_APP_EXTORTION = "LOAN_APP_EXTORTION"
    IDENTITY_THEFT = "IDENTITY_THEFT"
    OTHER = "OTHER"

class PaymentMethod(str, Enum):
    UPI = "UPI"
    DEBIT_CARD = "DEBIT_CARD"
    CREDIT_CARD = "CREDIT_CARD"
    NET_BANKING = "NET_BANKING"
    AEPS = "AEPS"
    WALLET = "WALLET"
    OTHER = "OTHER"

class ComplaintBase(BaseModel):
    fraud_type: Optional[FraudType] = FraudType.UPI_FRAUD
    fraud_amount: Optional[float] = None
    payment_method: Optional[PaymentMethod] = PaymentMethod.UPI
    incident_date: Optional[str] = None
    incident_time: Optional[str] = None
    transaction_id: Optional[str] = None
    suspect_phone: Optional[str] = None
    suspect_upi_id: Optional[str] = None
    suspect_bank_account: Optional[str] = None
    incident_description: Optional[str] = None
    victim_bank_name: Optional[str] = None
    victim_account_last4: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    user_id: Optional[str] = None

class ComplaintUpdate(BaseModel):
    fraud_type: Optional[FraudType] = None
    fraud_amount: Optional[float] = None
    payment_method: Optional[PaymentMethod] = None
    incident_date: Optional[str] = None
    incident_time: Optional[str] = None
    transaction_id: Optional[str] = None
    suspect_phone: Optional[str] = None
    suspect_upi_id: Optional[str] = None
    suspect_bank_account: Optional[str] = None
    incident_description: Optional[str] = None
    submission_status: Optional[SubmissionStatus] = None
    tracking_status: Optional[TrackingStatus] = None
    government_acknowledgement: Optional[str] = None

class ComplaintInDB(ComplaintBase):
    id: str = Field(alias="_id")
    user_id: str
    submission_status: SubmissionStatus = SubmissionStatus.DRAFT
    tracking_status: TrackingStatus = TrackingStatus.NOT_SUBMITTED
    government_acknowledgement: Optional[str] = None
    evidence_ids: List[str] = []
    formal_narrative: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)

class ComplaintResponse(ComplaintBase):
    id: str
    user_id: str
    submission_status: SubmissionStatus
    tracking_status: TrackingStatus
    government_acknowledgement: Optional[str] = None
    evidence_ids: List[str] = []
    formal_narrative: Optional[str] = None
    created_at: datetime
    updated_at: datetime
