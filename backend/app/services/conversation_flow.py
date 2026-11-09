from typing import Dict, Any, List, Tuple
from app.services.ai_extractor import CyberFraudExtractor
from app.core.security import sanitize_sensitive_data

QUESTIONS = {
    "English": {
        "greeting": "Hello! I am CyberSathi, your Cyber Fraud Complaint Assistant. Please tell me what happened in your own words. You can speak in English, Hindi, or Bengali.",
        "ask_amount": "I am truly sorry you had to go through this. To help report this accurately, could you please tell me how much money was deducted or lost?",
        "ask_payment_method": "Which payment method was used for this transaction? (e.g., UPI, Debit/Credit Card, Net Banking, or Wallet)",
        "ask_date_time": "When did this incident happen? (e.g., today, yesterday, or a specific date and time)",
        "ask_transaction_id": "Do you have the 12-digit UPI UTR number, bank reference number, or transaction ID from your SMS or banking app?",
        "ask_suspect_details": "Do you have the suspect's phone number, UPI ID (VPA), or website link they sent you?",
        "complaint_ready": "Thank you. I have collected the necessary details. I have prepared a formal complaint draft for your review. Please verify the information before official submission.",
        "active_fraud_alert": "🚨 IMPORTANT: Because this financial fraud occurred recently, please dial 1930 immediately to invoke the Citizen Financial Cyber Fraud Reporting System (CFCFRMS). This enables banks to freeze the fraudster's beneficiary account in real time!"
    },
    "Hindi": {
        "greeting": "नमस्ते! मैं साइबर साथी (CyberSathi) हूँ। कृपया मुझे बताएं कि आपके साथ क्या हुआ। आप हिंदी, बंगाली या अंग्रेजी में बोल सकते हैं।",
        "ask_amount": "मुझे बहुत खेद है कि आपके साथ ऐसा हुआ। सही शिकायत दर्ज करने के लिए, कृपया बताएं कि आपके खाते से कितने रुपये कटे या नुकसान हुआ?",
        "ask_payment_method": "इस लेनदेन के लिए किस भुगतान माध्यम का उपयोग किया गया था? (जैसे UPI, डेबिट/क्रेडिट कार्ड, या नेट बैंकिंग)",
        "ask_date_time": "यह घटना कब हुई थी? (जैसे आज, कल, या कोई तारीख और समय बताएं)",
        "ask_transaction_id": "क्या आपके पास 12 अंकों का UPI UTR नंबर, बैंक रेफरेंस नंबर या ट्रांजैक्शन आईडी है?",
        "ask_suspect_details": "क्या आपके पास धोखेबाज़ का फोन नंबर, UPI आईडी या भेजा गया कोई लिंक है?",
        "complaint_ready": "धन्यवाद। मैंने सभी आवश्यक विवरण एकत्र कर लिए हैं। मैंने आपकी समीक्षा के लिए एक औपचारिक शिकायत का मसौदा तैयार किया है। कृपया समीक्षा करें।",
        "active_fraud_alert": "🚨 ज़रूरी सूचना: यदि यह धोखाधड़ी हाल ही में हुई है, तो तुरंत 1930 हेल्पलाइन पर कॉल करें ताकि बैंक धोखेबाज़ के खाते को फ्रीज कर सके!"
    },
    "Bengali": {
        "greeting": "নমস্কার! আমি সাইবার সাথী (CyberSathi)। আপনার সাথে ঠিক কী ঘটেছে দয়া করে বলুন। আপনি বাংলা, হিন্দি বা ইংরেজিতে বলতে পারেন।",
        "ask_amount": "আপনার এই ক্ষতির জন্য আমি দুঃখিত। সঠিক অভিযোগ দায়ের করতে দয়া করে বলুন কত টাকা কাটা গেছে বা ক্ষতি হয়েছে?",
        "ask_payment_method": "লেনদেনের জন্য কোন মাধ্যম ব্যবহার করা হয়েছিল? (যেমন UPI, ডেবিট/ক্রেডিট কার্ড, বা নেট ব্যাঙ্কিং)",
        "ask_date_time": "এই ঘটনাটি কখন ঘটেছিল? (যেমন আজ, গতকাল, বা নির্দিষ্ট কোন সময়)",
        "ask_transaction_id": "আপনার ব্যাঙ্ক SMS বা অ্যাপে ১২ সংখ্যার UPI UTR নম্বর বা ট্রানজ্যাকশন আইডি কি আছে?",
        "ask_suspect_details": "প্রতারকের ফোন নম্বর, UPI আইডি বা পাঠানো কোনো লিঙ্ক কি আপনার কাছে আছে?",
        "complaint_ready": "ধন্যবাদ। আমি প্রয়োজনীয় তথ্য সংগ্রহ করেছি। আপনার পরীক্ষার জন্য একটি আনুষ্ঠানিক অভিযোগের খসড়া তৈরি করা হয়েছে।",
        "active_fraud_alert": "🚨 বিশেষ জরুরি: এই আর্থিক প্রতারণা সম্প্রতি ঘটলে অবিলম্বে ১৯৩০ হেল্পলাইনে কল করুন যাতে ব্যাঙ্ক প্রতারকের অ্যাকাউন্ট ফ্রিজ করতে পারে!"
    }
}

QUICK_OPTIONS = {
    "ask_payment_method": ["UPI (GPay/PhonePe)", "Debit/Credit Card", "Net Banking", "Other"],
    "ask_date_time": ["Today", "Yesterday", "2-3 Days Ago", "Older"],
    "ask_transaction_id": ["I have UTR Number", "I will upload Screenshot", "Not Available Now"],
    "ask_suspect_details": ["I have Suspect Phone", "I have Suspect UPI", "None Available"]
}

class ConversationManager:
    """
    Manages the conversational flow, evaluates missing fields, and triggers the next targeted question.
    """

    @classmethod
    def get_missing_fields(cls, extracted: Dict[str, Any]) -> List[str]:
        missing = []
        if not extracted.get("fraud_amount"):
            missing.append("fraud_amount")
        if not extracted.get("payment_method"):
            missing.append("payment_method")
        if not extracted.get("incident_date"):
            missing.append("incident_date")
        if not extracted.get("transaction_id") and not extracted.get("suspect_phone") and not extracted.get("suspect_upi_id"):
            missing.append("transaction_or_suspect")
        return missing

    @classmethod
    def process_turn(
        cls, 
        user_message: str, 
        existing_extracted: Dict[str, Any], 
        language: str = "English"
    ) -> Tuple[Dict[str, Any], str, List[str], bool, Optional[str], Optional[List[str]]]:
        """
        Processes a user turn:
        1. Sanitizes user input (detects & redacts any PIN/OTP).
        2. Extracts structured information from the input.
        3. Identifies missing fields.
        4. Selects the next appropriate follow-up question and quick options.
        5. Returns: (updated_extracted, assistant_response, missing_fields, is_complete, security_warning, quick_opts)
        """
        lang = language if language in QUESTIONS else "English"
        
        # 1. Sanitize
        clean_text, pin_detected, security_warning = sanitize_sensitive_data(user_message)
        
        # 2. Extract
        updated_extracted = CyberFraudExtractor.extract_all(clean_text, existing_extracted)
        
        # 3. Missing fields check
        missing = cls.get_missing_fields(updated_extracted)
        
        # 4. Generate next question
        is_complete = len(missing) == 0
        quick_opts = None
        assistant_reply = ""
        
        if is_complete:
            assistant_reply = QUESTIONS[lang]["complaint_ready"]
        elif "fraud_amount" in missing:
            assistant_reply = QUESTIONS[lang]["ask_amount"]
        elif "payment_method" in missing:
            assistant_reply = QUESTIONS[lang]["ask_payment_method"]
            quick_opts = QUICK_OPTIONS["ask_payment_method"]
        elif "incident_date" in missing:
            assistant_reply = QUESTIONS[lang]["ask_date_time"]
            quick_opts = QUICK_OPTIONS["ask_date_time"]
        elif "transaction_or_suspect" in missing:
            assistant_reply = QUESTIONS[lang]["ask_transaction_id"]
            quick_opts = QUICK_OPTIONS["ask_transaction_id"]
            
        # Add Active Fraud 1930 alert if amount > 0 and user just mentioned recent incident
        alert_needed = False
        if updated_extracted.get("fraud_amount") and (
            updated_extracted.get("incident_date") in ["today", "yesterday"] or 
            any(w in user_message.lower() for w in ["today", "just now", "yesterday", "अभी", "आज", "আজ"])
        ):
            alert_needed = True

        if alert_needed and not existing_extracted.get("_alert_shown"):
            updated_extracted["_alert_shown"] = True
            assistant_reply = f"{QUESTIONS[lang]['active_fraud_alert']}\n\n{assistant_reply}"

        return updated_extracted, assistant_reply, missing, is_complete, security_warning, quick_opts
