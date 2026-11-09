from typing import Dict, Any, List
from datetime import datetime

class CitizenServices:
    """
    Civic technology services suite for Indian cybercrime victims and citizen protection.
    """

    @classmethod
    def generate_rbi_zero_liability_claim(
        cls,
        complainant_name: str,
        bank_name: str,
        account_or_card_last4: str,
        fraud_amount: float,
        transaction_date: str,
        report_date: str,
        transaction_id_utr: str = "Pending Audit",
        cybercrime_ack_no: str = "Under 1930 Lodgement"
    ) -> Dict[str, Any]:
        """
        Generates a formal legal claim for 100% refund under Reserve Bank of India (RBI)
        Mandated Zero-Liability Framework (Circular DBR.No.Leg.BC.78/09.07.005/2017-18).
        """
        claim_letter = f"""FORMAL CLAIM FOR 100% REFUND UNDER RBI ZERO LIABILITY FRAMEWORK
Ref: RBI Notification DBR.No.Leg.BC.78/09.07.005/2017-18
Subject: Claim for reversal of unauthorized electronic transaction of INR {fraud_amount:,.2f}

To,
The Branch Manager & Principal Nodal Officer,
{bank_name},

Respected Sir/Madam,

I am writing to formally register a claim for immediate full restitution and shadow reversal regarding an unauthorized electronic transaction debited from my account/card ending in XX{account_or_card_last4}.

1. INCIDENT CHRONOLOGY & TRANSACTION DETAILS:
   - Account / Instrument Identifier: XX{account_or_card_last4}
   - Disputed Fraud Amount: INR {fraud_amount:,.2f}
   - Date & Time of Occurrence: {transaction_date}
   - Date of Notification to Bank: {report_date}
   - Disputed Transaction UTR / Ref No: {transaction_id_utr}
   - Cybercrime Acknowledgement Number (1930 / I4C): {cybercrime_ack_no}

2. STATUTORY LEGAL PROVISIONS INVOKED:
   Under Paragraph 6(a) of RBI Master Circular on "Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions":
   "A customer has ZERO LIABILITY where the unauthorized transaction occurs in the following events:
    (i) Contributory fraud/negligence/deficiency on the part of the bank (irrespective of whether or not the transaction is reported by the customer).
    (ii) A third party breach where the deficiency lies neither with the bank nor with the customer but lies elsewhere in the system, and the customer notifies the bank within three working days of receiving the communication from the bank regarding the unauthorized transaction."

3. FORMAL RELIEF REQUESTED:
   In accordance with Paragraph 9 of the aforementioned RBI Circular:
   a) The bank is legally mandated to credit (shadow reversal) the full disputed amount of INR {fraud_amount:,.2f} to my account within 10 working days from the date of this notice, without awaiting the final outcome of the insurance or cyber cell claim.
   b) The bank shall ensure that the resolution does not exceed 90 days from the date of receipt of the complaint, failing which full customer compensation must be provided.
   c) In the event of non-compliance or failure to resolve this within 30 days, this matter will be escalated directly to the RBI Banking Ombudsman via the CMS Portal (cms.rbi.org.in).

VERIFICATION:
I hereby certify that this transaction was not authorized by me, and I have fulfilled my duty to notify both the bank and the National Cyber Crime Reporting Portal without delay.

Complainant: {complainant_name}
Date: {datetime.now().strftime('%Y-%m-%d')}
"""
        return {
            "success": True,
            "bank_name": bank_name,
            "claim_amount": fraud_amount,
            "rbi_circular": "DBR.No.Leg.BC.78/09.07.005/2017-18",
            "statutory_shadow_reversal_days": 10,
            "maximum_resolution_days": 90,
            "ombudsman_url": "https://cms.rbi.org.in",
            "formal_claim_text": claim_letter
        }

    @classmethod
    def get_sanchar_saathi_services(cls) -> Dict[str, Any]:
        """
        Information and portal workflows for Central Equipment Identity Register (CEIR),
        TAFCOP (SIM connection verification), and Chakshu (Fraud caller reporting).
        """
        return {
            "portal_name": "Sanchar Saathi (Department of Telecommunications, Govt of India)",
            "official_url": "https://sancharsaathi.gov.in",
            "services": [
                {
                    "code": "CEIR",
                    "title": "Block Stolen or Lost Mobile Phone (CEIR)",
                    "description": "Blocks the IMEI number across all Indian telecom operators so the phone cannot be used with any SIM card.",
                    "official_url": "https://www.ceir.gov.in/Request/CeirUserBlockRequestDirect.jsp",
                    "checklist": [
                        "Copy of Police Complaint / e-FIR / DD Number",
                        "Original Purchase Invoice of the mobile device",
                        "Identity Proof (Aadhaar, Voter ID, PAN, or Passport)",
                        "Alternate mobile number to receive OTP for request tracking"
                    ],
                    "status_check_url": "https://www.ceir.gov.in/Request/CeirUserStatusRequest.jsp"
                },
                {
                    "code": "TAFCOP",
                    "title": "Check SIM Connections in Your Name (TAFCOP)",
                    "description": "View all active mobile connections issued against your Aadhaar/document and flag unauthorized or fake SIMs.",
                    "official_url": "https://tafcop.sancharsaathi.gov.in",
                    "checklist": [
                        "Enter your active Aadhaar-linked mobile number",
                        "Enter the OTP received",
                        "Review list of mobile numbers registered under your identity",
                        "Select 'Not my number' or 'Not required' to submit cancellation request to telecom operators"
                    ]
                },
                {
                    "code": "CHAKSHU",
                    "title": "Report Suspected Fraudulent Calls / WhatsApp (Chakshu)",
                    "description": "Report suspected fraudulent calls, SMS, and WhatsApp messages regarding KYC expiry, electricity cutoff, fake job offers, and lottery claims directly to DoT.",
                    "official_url": "https://sancharsaathi.gov.in/sfc/",
                    "checklist": [
                        "Screenshot of suspicious SMS / Call Log / WhatsApp chat",
                        "Suspect mobile number or sender header (e.g. VK-HDFCBK)",
                        "Date and time of communication",
                        "Short summary of deceptive claim made by scammer"
                    ]
                }
            ]
        }

    @classmethod
    def get_emergency_quick_actions(cls) -> Dict[str, Any]:
        """
        Offline USSD codes and immediate emergency action procedures.
        """
        return {
            "national_cyber_helpline": "1930",
            "national_emergency": "112",
            "universal_upi_delink_ussd": "*99*99#",
            "description": "Dial *99*99# from your registered mobile to immediately de-link UPI accounts across all banks without internet access.",
            "bank_emergency_actions": [
                {
                    "bank": "State Bank of India (SBI)",
                    "toll_free": "18001234 / 18002100",
                    "sms_block": "SMS 'BLOCK <last 4 digits of card>' to 567676",
                    "ussd": "*99*41#",
                    "app_lock": "YONO -> Services -> Manage Cards -> Lock"
                },
                {
                    "bank": "HDFC Bank",
                    "toll_free": "18002026161 / 18602676161",
                    "sms_block": "SMS 'BLOCK' to 5676712",
                    "ussd": "*99*43#",
                    "app_lock": "HDFC Mobile App -> Cards -> Instant Card Freeze"
                },
                {
                    "bank": "ICICI Bank",
                    "toll_free": "18001080",
                    "sms_block": "SMS 'IBLOCK <last 4 digits of account>' to 9215667766",
                    "ussd": "*99*44#",
                    "app_lock": "iMobile Pay -> Services -> Card Services -> Freeze"
                },
                {
                    "bank": "Punjab National Bank (PNB)",
                    "toll_free": "18001802222 / 18001032222",
                    "sms_block": "SMS 'HOT <16-digit Card No>' to 5607040",
                    "ussd": "*99*42#",
                    "app_lock": "PNB ONE -> Debit Card -> Hotlist"
                },
                {
                    "bank": "Axis Bank",
                    "toll_free": "18604195555 / 18605005555",
                    "sms_block": "SMS 'BLOCKCARD' to 5676782",
                    "ussd": "*99*45#",
                    "app_lock": "Open Axis Mobile -> Services -> Debit Cards -> Block"
                }
            ]
        }

    @classmethod
    def get_trending_scams(cls) -> List[Dict[str, Any]]:
        """
        Live Modus Operandi bulletins for active cyber fraud trends across India.
        """
        return [
            {
                "id": "scam_1",
                "title": "Digital Arrest Scam (Fake Police & CBI Video Calls)",
                "category": "IMPERSONATION",
                "risk": "CRITICAL",
                "modus_operandi": "Victims receive a call alleging their Aadhaar was used in money laundering or narcotics in a courier parcel. Scammers show fake police stations, official seals, and Supreme Court warrants on Skype/WhatsApp video calls, holding victims under 'Digital Arrest' for hours until they transfer funds to 'RBI verification accounts'.",
                "safety_rule": "There is NO legal concept of 'Digital Arrest' in Indian law. Law enforcement NEVER interrogates, arrests, or verifies bank accounts over video calls. Hang up immediately."
            },
            {
                "id": "scam_2",
                "title": "Electricity Bill Power Disconnection Threat",
                "category": "UTILITY_FRAUD",
                "risk": "CRITICAL",
                "modus_operandi": "SMS claiming 'Dear Customer, your electricity will be disconnected tonight at 9:30 PM due to previous month unpaid bill. Contact officer immediately at 98XXXXXXXX.' Calling leads to installation of remote desktop apps (AnyDesk) or fraudulent payment links.",
                "safety_rule": "Electricity distribution companies NEVER send mobile numbers for bill payments. Always pay via authorized portals or Bharat BillPay (BBPS)."
            },
            {
                "id": "scam_3",
                "title": "Work-From-Home / Telegram Video Like Scam",
                "category": "INVESTMENT_FRAUD",
                "risk": "HIGH",
                "modus_operandi": "Victims are lured via WhatsApp/Telegram to like YouTube videos or write Google reviews for Rs 150 each. After initial small payouts, victims are added to VIP groups and coerced to invest lakhs into fake crypto/merchant recharge portals.",
                "safety_rule": "Legitimate organizations never ask candidates to pay money to complete work tasks. Never transfer funds to prepaid task portals."
            },
            {
                "id": "scam_4",
                "title": "Malicious APK Loan & KYC Apps",
                "category": "MALWARE_EXTORTION",
                "risk": "CRITICAL",
                "modus_operandi": "Victims receive SMS or WhatsApp links to install APK files for instant loans or bank KYC updates. Once installed, the APK steals all contacts, gallery photos, and reads SMS OTPs, leading to unauthorized withdrawals and blackmail.",
                "safety_rule": "Never install .APK files received via WhatsApp or SMS. Only install apps directly from Google Play Store or Apple App Store."
            }
        ]
