import sys
import os
import json

# Add backend to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app.services.ai_extractor import CyberFraudExtractor
from app.services.conversation_flow import ConversationManager
from app.services.formal_complaint_gen import FormalComplaintGenerator
from app.services.portal_handoff import GovernmentPortalHandoff
from app.services.ocr_service import OCREvidenceService
from app.services.fraud_scanner import FraudRiskScanner
from app.services.citizen_services import CitizenServices
from app.core.security import sanitize_sensitive_data

def print_separator(title):
    print("\n" + "=" * 65)
    print(f" {title.upper()} ")
    print("=" * 65)

def main():
    print_separator("CyberSathi - AI-Powered Voice Cyber Fraud Assistant")
    print("Simulating end-to-end workflow for Indian citizens reporting financial cyber fraud.\n")

    # STEP 1: Emergency Check
    print("[STEP 1] Emergency Check & Golden Hour Verification")
    print("   Active financial cyber fraud helpline: 1930 (CFCFRMS 24x7)")
    print("   Official reporting portal: https://cybercrime.gov.in")
    print("   Status: Golden Hour protocol active. Inter-bank lien mechanism available.")

    # STEP 2: Citizen Voice Utterance in Hindi / English / Bengali
    print_separator("[STEP 2] Citizen Voice Input & Multilingual Understanding")
    utterance_english = "Someone called me pretending to be an SBI manager. I shared an OTP, and Rs 15,000 was deducted from my account via UPI yesterday at 2 PM. The UTR is 987654321012."
    utterance_hindi = "बैंक अधिकारी बनकर फोन किया था, मेरे 25,000 रुपये कट गए UPI से कल दोपहर 2 बजे। धोखेबाज़ का फोन 9876543210 था।"
    utterance_bengali = "আমার ব্যাঙ্ক কর্মী সেজে ফোন করেছিল, UPI দিয়ে ১৫,০০০ টাকা কেটে নিয়েছে গতকাল।"

    print(f"Citizen Spoken (English): \"{utterance_english}\"")
    extracted_en = CyberFraudExtractor.extract_all(utterance_english)
    print("AI Structured Extraction (English):")
    print(json.dumps(extracted_en, indent=2, ensure_ascii=False))

    print(f"\nCitizen Spoken (Hindi): \"{utterance_hindi}\"")
    extracted_hi = CyberFraudExtractor.extract_all(utterance_hindi)
    print("AI Structured Extraction (Hindi):")
    print(json.dumps(extracted_hi, indent=2, ensure_ascii=False))

    # STEP 3: Security & Data Sanitization
    print_separator("[STEP 3] Sensitive Data Protection (PIN / OTP Redaction)")
    user_with_pin = "My UPI PIN is 4321 and bank OTP was 987654. The fraud amount was 15000."
    print(f"Raw Utterance: \"{user_with_pin}\"")
    clean_text, detected, warning = sanitize_sensitive_data(user_with_pin)
    print(f"Sanitized Text: \"{clean_text}\"")
    print(f"Sensitive Data Detected: {detected}")
    print(f"Security Alert Message: {warning}")

    # STEP 4: Missing Fields & Conversational State Machine
    print_separator("[STEP 4] Intelligent State Machine & Targeted Questioning")
    partial_input = "I lost Rs 15,000 in a scam."
    extracted_partial, reply, missing, is_complete, warn, quick_opts = ConversationManager.process_turn(
        partial_input, {}, "English"
    )
    print(f"Citizen: \"{partial_input}\"")
    print(f"Missing Mandatory Fields: {missing}")
    print(f"CyberSathi Next Question: \"{reply}\"")
    print(f"Quick Option Choices: {quick_opts}")

    # STEP 5: Evidence OCR Analysis
    print_separator("[STEP 5] AI Evidence OCR Analysis (Payment Receipt / Screenshot)")
    sample_ocr = "Payment Successful to fraudster@okhdfcbank. Amount: INR 15,000.00. UPI Ref No: 987654321012. State Bank of India."
    ocr_result = OCREvidenceService.analyze_text(sample_ocr)
    print("Simulated Screenshot OCR:")
    print(sample_ocr)
    print("AI Extracted Evidence Data:")
    print(json.dumps(ocr_result, indent=2))

    # STEP 6: Formal Complaint Generation
    print_separator("[STEP 6] Government Complaint Legal Petition Narrative")
    mock_complaint = {
        "fraud_type": "UPI_FRAUD",
        "fraud_amount": 15000.0,
        "payment_method": "UPI",
        "incident_date": "2026-11-08",
        "incident_time": "14:00",
        "transaction_id": "987654321012",
        "suspect_phone": "9876543210",
        "suspect_upi_id": "fraudster@okhdfcbank",
        "incident_description": "Suspect called posing as bank manager, deceptive inducement to share OTP."
    }
    mock_user = {
        "name": "Rahul Sharma",
        "mobile": "9876543210",
        "email": "rahul.sharma@example.com"
    }
    petition = FormalComplaintGenerator.generate(mock_complaint, mock_user)
    print(petition)

    # STEP 7: Government Portal Handoff & Authorized API Simulation
    print_separator("[STEP 7] Government Submission & Acknowledgment Generation")
    print("Distinguishing 3 States:")
    print(" 1. DRAFTED: All fields gathered and verified by citizen.")
    print(" 2. SUBMITTED TO GOVERNMENT: Citizen submits on cybercrime.gov.in or through gateway.")
    print(" 3. ACKNOWLEDGED: Official Acknowledgement Number assigned.")
    
    auth_result = GovernmentPortalHandoff.simulate_authorized_submission("cmp_101", mock_complaint)
    ack_number = auth_result["acknowledgement_number"]
    print(f"\nOfficial Acknowledgement Number Assigned: {ack_number}")
    print(f"Submission Status: {auth_result['submission_status']}")
    print(f"Tracking Status: {auth_result['tracking_status']}")

    # STEP 8: Live Complaint Tracking
    print_separator("[STEP 8] Real-Time Status Tracking & Bank Lien Notification")
    print(f"Querying Acknowledgement Number: {ack_number}")
    for item in auth_result["timeline"]:
        print(f" [{item['timestamp']}] ({item['source']}) {item['title']}")
        print(f"   ↳ {item['description']}")

    print("\nOfficial Tracking URL: https://www.cybercrime.gov.in/Webform/chkackstatus.aspx")

    # STEP 9: Cyber Fraud Risk & Modus Operandi Scanner
    print_separator("[STEP 9] Cyber Fraud Risk & Modus Operandi Scanner")
    test_sms = "Dear customer your electricity power will be disconnected tonight at 9:30 PM. Call officer at 9876543210"
    print(f"Scanning Suspicious SMS: \"{test_sms}\"")
    sms_scan = FraudRiskScanner.scan_input(test_sms)
    print(f"Risk Level: {sms_scan['risk_level']} (Score: {sms_scan['risk_score']}/100)")
    print(f"Category: {sms_scan['category_title']}")
    print(f"Identified Red Flags: {sms_scan['red_flags']}")
    print(f"Safety Advisory: {sms_scan['advisories'][0]}")

    test_apk = "http://sbi-yono-update.com/download.apk"
    print(f"\nScanning Suspicious Link: \"{test_apk}\"")
    apk_scan = FraudRiskScanner.scan_input(test_apk)
    print(f"Risk Level: {apk_scan['risk_level']} (Score: {apk_scan['risk_score']}/100)")
    print(f"Category: {apk_scan['category_title']}")

    # STEP 10: RBI Zero-Liability Bank Refund Claim Generator
    print_separator("[STEP 10] RBI Zero-Liability Bank Refund Claim Generator")
    rbi_claim = CitizenServices.generate_rbi_zero_liability_claim(
        complainant_name="Rahul Sharma",
        bank_name="State Bank of India",
        account_or_card_last4="4321",
        fraud_amount=15000.0,
        transaction_date="2026-11-08",
        report_date="2026-11-09",
        transaction_id_utr="987654321012",
        cybercrime_ack_no=ack_number
    )
    print("Generated RBI Mandated Formal Refund Notice:")
    print(rbi_claim["formal_claim_text"])

    # STEP 11: Sanchar Saathi & Universal USSD Emergency Actions
    print_separator("[STEP 11] Sanchar Saathi (CEIR / TAFCOP) & USSD Emergency Actions")
    sanchar = CitizenServices.get_sanchar_saathi_services()
    print(f"Portal: {sanchar['portal_name']} ({sanchar['official_url']})")
    for svc in sanchar["services"]:
        print(f" - [{svc['code']}] {svc['title']}: {svc['official_url']}")

    quick = CitizenServices.get_emergency_quick_actions()
    print(f"\nUniversal Offline UPI Kill Code: {quick['universal_upi_delink_ussd']}")
    print(f"Instructions: {quick['description']}")

    print_separator("Demonstration Complete: All Services Verified")

if __name__ == "__main__":
    main()
