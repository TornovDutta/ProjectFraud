from typing import Dict, Any
from datetime import datetime

class FormalComplaintGenerator:
    """
    Generates an official, structured legal narrative for filing on the
    National Cyber Crime Reporting Portal (cybercrime.gov.in) and district Cyber Police.
    """

    @classmethod
    def generate(cls, complaint: Dict[str, Any], user: Dict[str, Any]) -> str:
        date_str = complaint.get("incident_date") or datetime.now().strftime("%Y-%m-%d")
        time_str = complaint.get("incident_time") or "Not Specified"
        amt_val = complaint.get("fraud_amount", 0.0)
        formatted_amt = f"INR {amt_val:,.2f}" if isinstance(amt_val, (int, float)) else f"INR {amt_val}"
        mode = complaint.get("payment_method", "UPI")
        utr = complaint.get("transaction_id", "Pending confirmation from bank statement")
        suspect_phone = complaint.get("suspect_phone", "Unknown / Spoofed Caller")
        suspect_upi = complaint.get("suspect_upi_id", "Not Available")
        fraud_type = complaint.get("fraud_type", "FINANCIAL_FRAUD")
        desc = complaint.get("incident_description", "The complainant was defrauded through unauthorized cyber transaction.")
        
        victim_name = user.get("name", "Victim")
        victim_mobile = user.get("mobile", "XXXXXXXXXX")
        victim_email = user.get("email", "Not provided")
        
        narrative = f"""FORMAL CYBERCRIME COMPLAINT PETITION
Reference: National Cyber Crime Reporting Portal (cybercrime.gov.in)
Incident Category: Financial Cyber Fraud ({fraud_type})

1. COMPLAINANT INFORMATION:
   Name: {victim_name}
   Registered Mobile: {victim_mobile}
   Email: {victim_email}

2. INCIDENT CHRONOLOGY:
   Date of Incident: {date_str}
   Time of Occurrence: {time_str}
   Disputed Fraud Amount: {formatted_amt}
   Payment Channel / Mode: {mode}

3. SUSPECT IDENTIFIERS:
   Suspect Phone / Contact: {suspect_phone}
   Suspect Beneficiary UPI / VPA: {suspect_upi}

4. TRANSACTION AUDIT TRAIL:
   Transaction Reference / UTR Number: {utr}
   Payment Status: Unauthorized deduction / Coerced fraudulent transfer

5. FACTUAL SUMMARY & MODUS OPERANDI:
   {desc}

6. APPLICABLE STATUTORY PROVISIONS INVOKED:
   - Section 66C of Information Technology Act 2000 (Identity theft)
   - Section 66D of Information Technology Act 2000 (Cheating by personation using computer resource)
   - Section 318(4) Bharatiya Nyaya Sanhita (BNS 2023) / Section 420 Indian Penal Code (Cheating and dishonestly inducing delivery of property)

7. PRAYER FOR RELIEF:
   It is respectfully requested that:
   a) An immediate notice be dispatched through CFCFRMS (1930 Helpline integration) to the recipient bank/wallet nodal officer to mark a LIEN on the fraudulent beneficiary account.
   b) A formal Cyber Crime Acknowledgement Number be generated for tracking and judicial assistance.
   c) Police Cyber Cell initiate swift recovery and statutory investigation into the suspect coordinates.

VERIFICATION:
I hereby verify and declare that the facts stated above are true and correct to the best of my knowledge and belief, and no material fact has been concealed.
"""
        return narrative
