import re
from typing import Dict, Any, List

class FraudRiskScanner:
    """
    AI-powered Cyber Fraud Risk & Modus Operandi Scanner for Indian citizens.
    Scans Phone Numbers, UPI VPAs, URLs, and SMS/Message texts against known fraud patterns.
    """

    # High-risk VoIP / international virtual prefixes commonly used in Digital Arrest & Fedex scams
    SUSPICIOUS_PHONE_PREFIXES = [
        "+92", "+1", "+44", "+880", "+977", "+234", "+254", "+7", "+370", "+371"
    ]

    # Phishing / Fraud keywords in UPI IDs
    UPI_FRAUD_KEYWORDS = [
        "refund", "cashback", "lottery", "reward", "support", "helpdesk",
        "customer", "nodal", "care", "service", "kyc", "verify", "paytmhelp",
        "sbisupport", "hdfchelp", "airtelcare", "jiosupport", "phonepehelp"
    ]

    # Phishing URL and APK patterns
    SUSPICIOUS_URL_PATTERNS = [
        r"\.apk$",
        r"bit\.ly",
        r"tinyurl\.com",
        r"is\.gd",
        r"ngrok\.io",
        r"firebaseapp\.com",
        r"weebly\.com",
        r"wixsite\.com",
        r"sbi.*\.site",
        r"kyc.*\.online",
        r"yono.*\.club",
        r"electricity.*\.top",
        r"challan.*\.info",
        r"pmkisan.*\.vip"
    ]

    # Modus operandi trigger phrases in SMS / Text
    SCAM_MODUS_OPERANDI = {
        "ELECTRICITY_BILL_SCAM": {
            "title": "Electricity Power Disconnection Scam",
            "keywords": ["electricity", "power will be disconnected", "unpaid bill", "contact electricity officer", "bill update", "light disconnect"],
            "severity": "CRITICAL",
            "advisory": "Electricity boards NEVER send personal mobile numbers for bill payments. Do not call this number or install any APK (such as QuickSupport/TeamViewer). Pay only via official electricity board portal or authorized apps like Bharat BillPay."
        },
        "DIGITAL_ARREST_SCAM": {
            "title": "Digital Arrest / Fake Law Enforcement Video Call",
            "keywords": ["digital arrest", "cbi", "mumbai police", "narcotics", "money laundering", "customs", "illegal package", "skype call", "supreme court arrest warrant"],
            "severity": "CRITICAL",
            "advisory": "Indian Police, CBI, ED, and Customs NEVER conduct arrests or investigations over WhatsApp, Skype, or video calls. There is NO legal provision for 'Digital Arrest' under Indian law. Disconnect immediately and call 1930."
        },
        "PART_TIME_JOB_TELEGRAM": {
            "title": "Part-Time Task & Telegram Investment Fraud",
            "keywords": ["part time job", "youtube like", "hotel review", "daily income 3000", "telegram task", "vip task", "crypto recharge", "earn from home"],
            "severity": "HIGH",
            "advisory": "Scammers give small initial payouts (Rs 150-500) to gain trust, then trick victims into depositing lakhs for 'prepaid merchant tasks'. Never send money to earn task commissions."
        },
        "FAKE_CUSTOMER_CARE_APK": {
            "title": "Fake Customer Support & Screen Sharing APK",
            "keywords": ["download quicksupport", "anydesk", "teamviewer", "rustdesk", "install apk", "bank kyc update", "pan card update", "sim block"],
            "severity": "CRITICAL",
            "advisory": "Banks NEVER ask you to download AnyDesk, QuickSupport, or .APK files from links. Screen-sharing apps allow fraudsters to view your OTP and control your device remotely."
        },
        "FEDEX_COURIER_DRUGS": {
            "title": "FedEx / Courier Parcel Contraband Scam",
            "keywords": ["fedex parcel", "dhl courier", "drugs found", "taiwan parcel", "passport seized", "dhl parcel held", "customs clearance fee"],
            "severity": "HIGH",
            "advisory": "Courier companies do not call citizens claiming contraband or drugs in parcels to extort money through fake police transfers. Report immediately to cybercrime.gov.in."
        },
        "LOTTERY_KBC_REWARD": {
            "title": "Lottery / KBC / PM Loan Subsidy Scam",
            "keywords": ["kbc lottery", "won 25 lakh", "pm yojana loan", "scratch card", "lottery tax deposit", "claim cash prize"],
            "severity": "HIGH",
            "advisory": "Government schemes and legitimate companies never ask for an upfront 'tax clearance' or 'processing deposit' to release lottery or loan winnings."
        }
    }

    @classmethod
    def scan_input(cls, query: str, query_type: str = "AUTO") -> Dict[str, Any]:
        """
        Scans a query (phone, upi, url, or message text) and returns risk assessment.
        """
        clean = query.strip()
        red_flags: List[str] = []
        detected_category = "GENERAL_SUSPICIOUS"
        category_title = "Suspicious Communication Detected"
        risk_score = 15 # baseline low
        advisories: List[str] = []

        # 1. Determine or auto-detect query type
        if query_type == "AUTO":
            if "@" in clean and not clean.startswith("http") and " " not in clean:
                query_type = "UPI"
            elif clean.startswith("http://") or clean.startswith("https://") or clean.endswith(".apk") or ".com" in clean or ".in" in clean:
                query_type = "URL"
            elif re.match(r"^(\+?\d{1,4})?[\s\-]?[6-9]\d{9}$", clean) or (clean.startswith("+") and len(clean) >= 10):
                query_type = "PHONE"
            else:
                query_type = "TEXT"

        # 2. Analyze based on type
        if query_type == "PHONE":
            # Check for international spoofing prefixes used in Indian cybercrimes
            for prefix in cls.SUSPICIOUS_PHONE_PREFIXES:
                if clean.startswith(prefix):
                    red_flags.append(f"Originates from virtual/VoIP international prefix ({prefix}) commonly used in impersonation scams.")
                    risk_score += 45
                    break

            if re.search(r"1800\d{6,}", clean):
                red_flags.append("Simulates toll-free bank number format often posted on Google Maps by fraudsters.")
                risk_score += 30

            advisories.append("Do not call back or share OTP/PIN. Verify official contact numbers strictly from the bank's official website.")

        elif query_type == "UPI":
            lower_vpa = clean.lower()
            for kw in cls.UPI_FRAUD_KEYWORDS:
                if kw in lower_vpa:
                    red_flags.append(f"UPI ID contains deceptive keyword '{kw}', commonly used to impersonate official support desks.")
                    risk_score += 45
                    break

            if any(lower_vpa.endswith(ext) for ext in ["@ybl", "@paytm", "@ibl", "@axl"]) and any(w in lower_vpa for w in ["care", "help", "support"]):
                red_flags.append("Personal UPI handle disguised as an institutional bank customer care desk.")
                risk_score += 35

            advisories.append("Entering your UPI PIN ALWAYS DEDUCTS money from your account. You NEVER need to enter a UPI PIN to receive money or refunds.")

        elif query_type == "URL":
            lower_url = clean.lower()
            if ".apk" in lower_url:
                red_flags.append("Direct link to Android Package (.APK). Installing external APKs bypasses Google Play Protect and can steal banking credentials.")
                risk_score += 60
                detected_category = "PHISHING_APK_DOWNLOAD"
                category_title = "Malicious APK Installation Link"

            for pat in cls.SUSPICIOUS_URL_PATTERNS:
                if re.search(pat, lower_url):
                    red_flags.append(f"URL matches high-risk pattern or URL shortener ({pat}).")
                    risk_score += 35
                    break

            if not lower_url.startswith("https://"):
                red_flags.append("Insecure HTTP connection (no SSL encryption).")
                risk_score += 20

            advisories.append("Do not click or install files from unknown links. Government portals in India always end with '.gov.in' or '.nic.in'.")

        # 3. Analyze text content for Modus Operandi triggers
        lower_text = clean.lower()
        for scam_key, scam_info in cls.SCAM_MODUS_OPERANDI.items():
            matches = [kw for kw in scam_info["keywords"] if kw in lower_text]
            if len(matches) >= 1:
                red_flags.append(f"Matches {scam_info['title']} indicators: {', '.join(matches[:3])}.")
                detected_category = scam_key
                category_title = scam_info["title"]
                advisories.append(scam_info["advisory"])
                if scam_info["severity"] == "CRITICAL":
                    risk_score += 55
                else:
                    risk_score += 35
                break

        # Additional urgency / psychological manipulation flags
        if any(w in lower_text for w in ["urgent", "immediately", "within 2 hours", "tonight 9:30", "account blocked"]):
            red_flags.append("Uses artificial urgency or threats to cause panic and rush the victim.")
            risk_score += 20

        if any(w in lower_text for w in ["otp", "pin", "cvv", "password"]):
            red_flags.append("Solicits security credentials (OTP, PIN, CVV) which legitimate institutions never request.")
            risk_score += 40

        # Cap risk score between 10 and 99
        risk_score = min(99, max(10, risk_score))

        # Risk Classification
        if risk_score >= 70:
            risk_level = "CRITICAL"
        elif risk_score >= 45:
            risk_level = "HIGH"
        elif risk_score >= 25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        if not advisories:
            advisories.append("If this transaction was unauthorized or you shared OTP, call 1930 immediately to freeze the recipient bank account.")

        return {
            "query": query,
            "query_type": query_type,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "category": detected_category,
            "category_title": category_title,
            "red_flags": red_flags,
            "advisories": advisories,
            "emergency_helpline": "1930",
            "official_portal": "https://cybercrime.gov.in"
        }
