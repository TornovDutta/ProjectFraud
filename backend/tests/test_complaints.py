import pytest
from app.services.formal_complaint_gen import FormalComplaintGenerator
from app.services.portal_handoff import GovernmentPortalHandoff

def test_formal_complaint_generation():
    complaint = {
        "fraud_type": "UPI_FRAUD",
        "fraud_amount": 15000.0,
        "payment_method": "UPI",
        "incident_date": "2026-11-08",
        "incident_time": "14:00",
        "transaction_id": "987654321012",
        "suspect_phone": "9876543210",
        "suspect_upi_id": "scammer@okhdfcbank",
        "incident_description": "Suspect posed as bank official asking for verification."
    }
    user = {
        "name": "Amit Roy",
        "mobile": "9830098300",
        "email": "amit.roy@example.com"
    }
    
    narrative = FormalComplaintGenerator.generate(complaint, user)
    
    assert "FORMAL CYBERCRIME COMPLAINT PETITION" in narrative
    assert "Amit Roy" in narrative
    assert "987654321012" in narrative
    assert "Section 66D of Information Technology Act 2000" in narrative
    assert "CFCFRMS" in narrative

def test_guided_submission_packet():
    complaint = {
        "fraud_type": "UPI_FRAUD",
        "fraud_amount": 15000.0,
        "payment_method": "UPI",
        "transaction_id": "987654321012"
    }
    user = {"name": "Citizen", "mobile": "9876543210"}
    packet = GovernmentPortalHandoff.get_guided_submission_packet(complaint, user)
    
    assert "checklist" in packet
    assert len(packet["checklist"]) == 5
    assert packet["official_portal_url"] == "https://cybercrime.gov.in"
    assert packet["prefilled_fields"]["utr_or_txn_id"] == "987654321012"

def test_authorized_submission_simulation():
    res = GovernmentPortalHandoff.simulate_authorized_submission("cmp_123", {"fraud_amount": 15000})
    
    assert res["success"] is True
    assert res["acknowledgement_number"] is not None
    assert len(res["acknowledgement_number"]) >= 12
    assert res["submission_status"] == "ACKNOWLEDGED"
    assert len(res["timeline"]) >= 2
