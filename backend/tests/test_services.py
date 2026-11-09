import pytest
from app.services.fraud_scanner import FraudRiskScanner
from app.services.citizen_services import CitizenServices

def test_fraud_scanner_phone():
    res = FraudRiskScanner.scan_input("+92 300 1234567")
    assert res["query_type"] == "PHONE"
    assert res["risk_level"] in ["HIGH", "CRITICAL"]
    assert any("VoIP" in f or "+92" in f for f in res["red_flags"])

def test_fraud_scanner_upi():
    res = FraudRiskScanner.scan_input("sbi.customer.care@oksbi")
    assert res["query_type"] == "UPI"
    assert res["risk_score"] > 40
    assert any("care" in f or "deceptive" in f for f in res["red_flags"])

def test_fraud_scanner_url_apk():
    res = FraudRiskScanner.scan_input("http://sbi-yono-update.com/download.apk")
    assert res["query_type"] == "URL"
    assert res["risk_level"] == "CRITICAL"
    assert "PHISHING_APK_DOWNLOAD" in res["category"]

def test_fraud_scanner_electricity_text():
    sms = "Dear customer your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Contact officer immediately at 9876543210"
    res = FraudRiskScanner.scan_input(sms)
    assert res["category"] == "ELECTRICITY_BILL_SCAM"
    assert res["risk_level"] == "CRITICAL"
    assert len(res["advisories"]) >= 1

def test_rbi_zero_liability_claim():
    claim = CitizenServices.generate_rbi_zero_liability_claim(
        complainant_name="Amit Roy",
        bank_name="HDFC Bank",
        account_or_card_last4="4321",
        fraud_amount=25000.0,
        transaction_date="2026-11-08",
        report_date="2026-11-09",
        transaction_id_utr="987654321012",
        cybercrime_ack_no="20261109123456"
    )
    assert claim["success"] is True
    assert claim["statutory_shadow_reversal_days"] == 10
    assert "DBR.No.Leg.BC.78/09.07.005/2017-18" in claim["formal_claim_text"]
    assert "INR 25,000.00" in claim["formal_claim_text"]
    assert "cms.rbi.org.in" in claim["ombudsman_url"]

def test_sanchar_saathi_services():
    data = CitizenServices.get_sanchar_saathi_services()
    assert "Sanchar Saathi" in data["portal_name"]
    codes = [s["code"] for s in data["services"]]
    assert "CEIR" in codes
    assert "TAFCOP" in codes
    assert "CHAKSHU" in codes

def test_quick_emergency_actions():
    actions = CitizenServices.get_emergency_quick_actions()
    assert actions["universal_upi_delink_ussd"] == "*99*99#"
    assert len(actions["bank_emergency_actions"]) >= 5
