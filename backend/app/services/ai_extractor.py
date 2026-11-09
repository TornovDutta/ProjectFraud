import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

# Indic numeral mapping
BENGALI_DIGITS = {'০':'0', '১':'1', '২':'2', '৩':'3', '৪':'4', '৫':'5', '৬':'6', '৭':'7', '৮':'8', '৯':'9'}
DEVANAGARI_DIGITS = {'०':'0', '१':'1', '२':'2', '३':'3', '४':'4', '५':'5', '६':'6', '७':'7', '८':'8', '९':'9'}

def normalize_indic_numerals(text: str) -> str:
    """Replaces Bengali and Devanagari digits with standard Arabic digits."""
    result = []
    for ch in text:
        if ch in BENGALI_DIGITS:
            result.append(BENGALI_DIGITS[ch])
        elif ch in DEVANAGARI_DIGITS:
            result.append(DEVANAGARI_DIGITS[ch])
        else:
            result.append(ch)
    return "".join(result)

class CyberFraudExtractor:
    """
    Intelligent Information Extraction System for Cyber Fraud Complaints.
    Supports Multilingual natural speech in English, Hindi, and Bengali.
    Extracts:
      - fraud_amount
      - fraud_type
      - payment_method
      - transaction_id (UTR / UPI Ref / Bank Ref)
      - suspect_phone
      - suspect_upi_id
      - incident_date & time
    """

    @classmethod
    def extract_amount(cls, text: str) -> Optional[float]:
        norm_text = normalize_indic_numerals(text)
        
        # Look for ₹, Rs, INR, rupees, টাকা, रुपये followed or preceded by numbers
        patterns = [
            r'(?:₹|rs\.?|inr|rupees?|रुपये?|টাকা?)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)',
            r'([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr|rupees?|रुपये?|টাকা?)',
            r'\b([0-9]{1,2})\s*(?:k|hazar|hazaar|হাজার|हजार)\b',
            r'\b([0-9]{2,7})\b' # bare numbers between 100 and 10,000,000
        ]
        
        # Check "15k" or "15 hazar"
        k_match = re.search(r'\b([0-9]+)\s*(?:k|hazar|hazaar|হাজার|हजार)\b', norm_text, re.IGNORECASE)
        if k_match:
            try:
                return float(k_match.group(1)) * 1000
            except ValueError:
                pass

        for pat in patterns[:3]:
            m = re.search(pat, norm_text, re.IGNORECASE)
            if m:
                raw_num = m.group(1).replace(',', '')
                try:
                    val = float(raw_num)
                    if 10 <= val <= 10000000:
                        return val
                except ValueError:
                    continue
                    
        return None

    @classmethod
    def extract_payment_method(cls, text: str) -> Optional[str]:
        t = text.lower()
        if any(w in t for w in ["upi", "gpay", "google pay", "phonepe", "paytm", "bhim", "यूपीआई", "ইউপিআই"]):
            return "UPI"
        if any(w in t for w in ["credit card", "क्रेडिट कार्ड", "ক্রেডিট কার্ড"]):
            return "CREDIT_CARD"
        if any(w in t for w in ["debit card", "atm card", "डेबिट कार्ड", "ডেবিট কার্ড", "এটিএম"]):
            return "DEBIT_CARD"
        if any(w in t for w in ["net banking", "internet banking", "नेट बैंकिंग", "নেট ব্যাংকিং"]):
            return "NET_BANKING"
        if any(w in t for w in ["wallet", "वॉलेट", "ওয়ালেট"]):
            return "WALLET"
        if any(w in t for w in ["aeps", "aadhaar pay", "आधार पे"]):
            return "AEPS"
        return None

    @classmethod
    def extract_fraud_type(cls, text: str) -> Optional[str]:
        t = text.lower()
        if any(w in t for w in ["bank employee", "bank manager", "bank officer", "बैंक अधिकारी", "ব্যাঙ্ক কর্মী", "fake call"]):
            return "FAKE_CUSTOMER_CARE"
        if any(w in t for w in ["otp", "one time password", "ओटीपी"]):
            return "OTP_SCAM"
        if any(w in t for w in ["link", "sms", "electricity bill", "bijli bill", "link click", "बिजली बिल", "মেসেজে লিংক"]):
            return "PHISHING"
        if any(w in t for w in ["part time job", "telegram job", "youtube like job", "investment scam", "नौकरी", "চাকরি"]):
            return "JOB_INVESTMENT_SCAM"
        if any(w in t for w in ["loan app", "instant loan", "हफ्ता वसूली"]):
            return "LOAN_APP_EXTORTION"
        if any(w in t for w in ["upi", "qr code", "scan qr", "phonepe", "gpay", "paytm"]):
            return "UPI_FRAUD"
        return "UPI_FRAUD" # Default financial fraud category

    @classmethod
    def extract_transaction_id(cls, text: str) -> Optional[str]:
        norm = normalize_indic_numerals(text)
        # UPI UTR or Reference is typically 12 digits
        utr_match = re.search(r'\b(?:utr|ref|transaction\s*id|txn\s*id|id)?\s*:?\s*([0-9]{12})\b', norm, re.IGNORECASE)
        if utr_match:
            return utr_match.group(1)
            
        # General transaction alphanumeric ID (8 to 25 chars)
        ref_match = re.search(r'\b(?:txn|ref|utr|id)[:\s#]+([A-Za-z0-9]{8,25})\b', norm, re.IGNORECASE)
        if ref_match:
            return ref_match.group(1)
            
        return None

    @classmethod
    def extract_suspect_phone(cls, text: str) -> Optional[str]:
        norm = normalize_indic_numerals(text)
        # 10-digit Indian mobile number starting with 6, 7, 8, or 9
        phone_match = re.search(r'\b(?:\+91[\s-]?)?([6-9][0-9]{9})\b', norm)
        if phone_match:
            return phone_match.group(1)
        return None

    @classmethod
    def extract_suspect_upi(cls, text: str) -> Optional[str]:
        # UPI Virtual Payment Address (e.g. scammer@okaxis, 9876543210@paytm)
        upi_match = re.search(r'\b([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})\b', text)
        if upi_match:
            return upi_match.group(1)
        return None

    @classmethod
    def extract_incident_timing(cls, text: str) -> Dict[str, Optional[str]]:
        t = text.lower()
        today = datetime.now()
        date_str = None
        time_str = None
        
        if any(w in t for w in ["today", "aaj", "आज", "আজ"]):
            date_str = today.strftime("%Y-%m-%d")
        elif any(w in t for w in ["yesterday", "kal", "कल", "গতকাল"]):
            date_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")
        elif any(w in t for w in ["day before yesterday", "parso", "परसों", "গত পরশু"]):
            date_str = (today - timedelta(days=2)).strftime("%Y-%m-%d")
        else:
            # Check for explicit date like 2026-11-08 or 08/11/2026
            dm = re.search(r'\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})\b', text)
            if dm:
                date_str = f"{dm.group(3)}-{dm.group(2).zfill(2)}-{dm.group(1).zfill(2)}"

        # Check for time like 2 PM, 2:30 pm, 14:00, दोपहर 2 बजे, দুপুর ২টো
        norm_t = normalize_indic_numerals(t)
        tm = re.search(r'\b(\d{1,2}(?::\d{2})?)\s*(am|pm|बजे|টো)\b', norm_t, re.IGNORECASE)
        if not tm:
            tm = re.search(r'(?:at|around|समय|সময়)\s*(\d{1,2}(?::\d{2})?)\s*(am|pm|बजे|টো)?', norm_t, re.IGNORECASE)
        if tm:
            time_str = tm.group(0).strip()
            
        return {"incident_date": date_str, "incident_time": time_str}

    @classmethod
    def extract_all(cls, text: str, existing_fields: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Merges new extractions from the current utterance with previously collected fields.
        """
        fields = (existing_fields or {}).copy()
        
        # 1. Amount
        amt = cls.extract_amount(text)
        if amt and not fields.get("fraud_amount"):
            fields["fraud_amount"] = amt
            
        # 2. Payment Method
        pm = cls.extract_payment_method(text)
        if pm and not fields.get("payment_method"):
            fields["payment_method"] = pm
            
        # 3. Fraud Type
        ft = cls.extract_fraud_type(text)
        if ft and not fields.get("fraud_type"):
            fields["fraud_type"] = ft
            
        # 4. Transaction ID
        tx_id = cls.extract_transaction_id(text)
        if tx_id and not fields.get("transaction_id"):
            fields["transaction_id"] = tx_id
            
        # 5. Suspect Phone
        s_phone = cls.extract_suspect_phone(text)
        if s_phone and not fields.get("suspect_phone"):
            fields["suspect_phone"] = s_phone
            
        # 6. Suspect UPI
        s_upi = cls.extract_suspect_upi(text)
        if s_upi and not fields.get("suspect_upi_id"):
            fields["suspect_upi_id"] = s_upi
            
        # 7. Incident Date & Time
        timing = cls.extract_incident_timing(text)
        if timing.get("incident_date") and not fields.get("incident_date"):
            fields["incident_date"] = timing["incident_date"]
        if timing.get("incident_time") and not fields.get("incident_time"):
            fields["incident_time"] = timing["incident_time"]
            
        # Accumulate incident description
        existing_desc = fields.get("incident_description", "")
        if not existing_desc:
            fields["incident_description"] = text.strip()
        elif text.strip() not in existing_desc:
            fields["incident_description"] = f"{existing_desc}. {text.strip()}"
            
        return fields
