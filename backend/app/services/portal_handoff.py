from typing import Dict, Any, List
import random
from datetime import datetime, timedelta
from app.models.complaint import SubmissionStatus, TrackingStatus

class GovernmentPortalHandoff:
    """
    Manages the government portal handoff:
    1. Guided submission instructions & clipboard-ready fields
    2. Authorized API simulation
    3. Status synchronization & tracking
    """

    OFFICIAL_PORTAL_URL = "https://cybercrime.gov.in"
    OFFICIAL_TRACKING_URL = "https://www.cybercrime.gov.in/Webform/chkackstatus.aspx"
    OFFICIAL_HELPLINE = "1930"

    @classmethod
    def get_guided_submission_packet(cls, complaint: Dict[str, Any], user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepares structured clipboard fields and step-by-step guidance for manual submission.
        """
        return {
            "official_portal_url": cls.OFFICIAL_PORTAL_URL,
            "helpline": cls.OFFICIAL_HELPLINE,
            "checklist": [
                {
                    "step": 1,
                    "title": "Visit Official Portal",
                    "instruction": "Open cybercrime.gov.in and click on 'Report Cyber Crime' -> 'Financial Fraud'.",
                    "action_url": cls.OFFICIAL_PORTAL_URL
                },
                {
                    "step": 2,
                    "title": "Citizen Login with Mobile OTP",
                    "instruction": f"Login with your mobile number ({user.get('mobile', '')}) and verify government OTP.",
                },
                {
                    "step": 3,
                    "title": "Enter Incident & Transaction Details",
                    "instruction": "Paste the pre-filled fields provided below into the respective portal boxes.",
                },
                {
                    "step": 4,
                    "title": "Upload Evidence",
                    "instruction": "Upload your payment receipts or bank statement screenshot.",
                },
                {
                    "step": 5,
                    "title": "Save Acknowledgement Number",
                    "instruction": "Once submitted, the portal will provide a 14-digit Acknowledgement Number. Enter it in CyberSathi to track updates automatically.",
                }
            ],
            "prefilled_fields": {
                "category": "Financial Fraud",
                "sub_category": complaint.get("fraud_type", "UPI_FRAUD"),
                "date_of_incident": complaint.get("incident_date", ""),
                "time_of_incident": complaint.get("incident_time", ""),
                "loss_amount": str(complaint.get("fraud_amount", "")),
                "transaction_mode": complaint.get("payment_method", "UPI"),
                "utr_or_txn_id": complaint.get("transaction_id", ""),
                "suspect_mobile": complaint.get("suspect_phone", ""),
                "suspect_upi": complaint.get("suspect_upi_id", ""),
                "formal_narrative": complaint.get("formal_narrative", "")
            }
        }

    @classmethod
    def simulate_authorized_submission(cls, complaint_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulates an authorized national portal submission and returns an official Acknowledgement Number.
        """
        now = datetime.now()
        ack_number = f"{now.strftime('%Y%m')}{random.randint(10000000, 99999999)}"
        
        timeline_updates = [
            {
                "status": TrackingStatus.SUBMITTED_TO_PORTAL.value,
                "title": "Complaint Submitted to National Cybercrime Portal",
                "description": f"Complaint successfully lodged under National Citizen Financial Cyber Fraud Reporting System. Acknowledgement No. {ack_number} issued.",
                "source": "OFFICIAL_PORTAL",
                "timestamp": now.isoformat()
            },
            {
                "status": TrackingStatus.BANK_FREEZE_DISPATCHED.value,
                "title": "1930 / I4C Bank Lien Notice Dispatched",
                "description": "Electronic alert dispatched to recipient bank's Nodal Cyber Officer to place a freeze/lien on the fraudulent account.",
                "source": "BANK",
                "timestamp": (now + timedelta(minutes=15)).isoformat()
            }
        ]
        
        return {
            "success": True,
            "acknowledgement_number": ack_number,
            "submission_status": SubmissionStatus.ACKNOWLEDGED.value,
            "tracking_status": TrackingStatus.BANK_FREEZE_DISPATCHED.value,
            "timeline": timeline_updates,
            "message": "Complaint acknowledged by National Cyber Crime Reporting Portal."
        }
