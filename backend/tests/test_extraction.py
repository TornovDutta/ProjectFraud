import pytest
from app.services.ai_extractor import CyberFraudExtractor
from app.core.security import sanitize_sensitive_data
from app.services.conversation_flow import ConversationManager

def test_english_extraction():
    text = "Someone called me pretending to be a bank employee. I shared an OTP, and Rs 15000 was deducted from my account via UPI yesterday at 2 PM. The UTR is 987654321012."
    extracted = CyberFraudExtractor.extract_all(text)
    
    assert extracted.get("fraud_amount") == 15000.0
    assert extracted.get("payment_method") == "UPI"
    assert extracted.get("transaction_id") == "987654321012"
    assert extracted.get("incident_date") is not None
    assert extracted.get("incident_time") is not None

def test_hindi_extraction():
    text = "मेरे खाते से 25000 रुपये कट गए कल दोपहर 2 बजे। धोखेबाज़ का फोन नंबर 9876543210 था और UTR 123456789012 है।"
    extracted = CyberFraudExtractor.extract_all(text)
    
    assert extracted.get("fraud_amount") == 25000.0
    assert extracted.get("suspect_phone") == "9876543210"
    assert extracted.get("transaction_id") == "123456789012"

def test_bengali_extraction():
    text = "আমার ব্যাঙ্ক থেকে ১৫০০০ টাকা কেটে নিয়েছে UPI দিয়ে গতকাল দুপুর ২টোয়।"
    extracted = CyberFraudExtractor.extract_all(text)
    
    assert extracted.get("fraud_amount") == 15000.0
    assert extracted.get("payment_method") == "UPI"

def test_security_sanitization_pin_and_otp():
    text = "My UPI PIN is 4321 and my bank OTP is 876543."
    clean, detected, warning = sanitize_sensitive_data(text)
    
    assert detected is True
    assert "4321" not in clean
    assert "876543" not in clean
    assert "[REDACTED_SECURITY_DATA]" in clean
    assert "SECURITY ALERT" in warning

def test_conversation_flow_missing_fields():
    # Turn 1: user only gives amount
    turn1_text = "I lost Rs 15000 in a scam."
    extracted, reply, missing, is_complete, warning, quick_opts = ConversationManager.process_turn(turn1_text, {}, "English")
    
    assert extracted.get("fraud_amount") == 15000.0
    assert is_complete is False
    assert "payment_method" in missing
    assert quick_opts is not None
