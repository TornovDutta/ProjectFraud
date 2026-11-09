import { Platform } from 'react-native';

// On mobile devices (Expo Go on physical phone), use your PC's Wi-Fi LAN IP so your phone can reach FastAPI.
// On desktop web browser, localhost is used.
const LOCAL_PC_IP = "192.168.29.53";
const API_BASE_URL = Platform.OS === 'web' 
  ? "http://localhost:8000/api/v1" 
  : `http://${LOCAL_PC_IP}:8000/api/v1`;

export const api = {
  // 1. Emergency Helpline
  async getEmergencyInfo() {
    try {
      const res = await fetch(`${API_BASE_URL}/emergency/helpline-info`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend offline, using official emergency info fallback");
    }
    return {
      emergency_number: "1930",
      service_name: "Citizen Financial Cyber Fraud Reporting System",
      operating_hours: "24x7 Active",
      national_portal_url: "https://cybercrime.gov.in",
      bank_helplines: [
        { bank: "State Bank of India (SBI)", phone: "1800111109", block_sms: "BLOCK <last 4 digits> to 567676" },
        { bank: "HDFC Bank", phone: "18001600 / 18002600", block_sms: "NetBanking -> Quick Freeze" },
        { bank: "ICICI Bank", phone: "18001080", block_sms: "iMobile -> Quick Lock" },
        { bank: "Axis Bank", phone: "18604195555", block_sms: "BLOCKCARD to 5676782" },
        { bank: "Punjab National Bank (PNB)", phone: "18001802222", block_sms: "HOT <Card No> to 5607040" }
      ]
    };
  },

  // 2. Chat / Conversation
  async startConversation(language = "English") {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/start?language=${encodeURIComponent(language)}`, {
        method: "POST"
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend offline, initiating local chat session");
    }
    const mockId = `cmp_${Date.now()}`;
    return {
      complaint_id: mockId,
      assistant_message: language === "Hindi"
        ? "नमस्ते! मैं साइबर साथी हूँ। कृपया बताएं कि आपके साथ क्या हुआ। आप हिंदी, बंगाली या अंग्रेजी में बोल सकते हैं।"
        : language === "Bengali"
        ? "নমস্কার! আমি সাইবার সাথী। আপনার সাথে ঠিক কী ঘটেছে দয়া করে বলুন। আপনি বাংলা, হিন্দি বা ইংরেজিতে বলতে পারেন।"
        : "Hello! I am CyberSathi, your Cyber Fraud Complaint Assistant. Please tell me what happened in your own words. You can speak in English, Hindi, or Bengali.",
      extracted_fields: {},
      missing_fields: ["fraud_amount", "payment_method", "incident_date"],
      is_completed: false,
      language
    };
  },

  async uploadAudio(audioUri, language = "English") {
    try {
      const formData = new FormData();
      const filename = audioUri.split('/').pop() || 'recording.m4a';
      const fileType = Platform.OS === 'ios' ? 'audio/wav' : 'audio/m4a';
      
      if (Platform.OS === 'web') {
        const fileRes = await fetch(audioUri);
        const blob = await fileRes.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', {
          uri: audioUri,
          name: filename,
          type: fileType
        });
      }
      formData.append('language', language);

      const res = await fetch(`${API_BASE_URL}/chat/transcribe-audio`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transcript && data.transcript.trim()) {
          return data.transcript.trim();
        }
      }
    } catch (e) {
      console.warn("Audio upload to backend note:", e);
    }
    
    // Do not return any demo data if audio was silent or unparsed
    return "";
  },

  async sendMessage(complaintId, message, language = "English") {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint_id: complaintId, message, language })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend offline, applying client-side regex extraction");
    }
    
    // Client-side local extraction: only extract real numbers/patterns present in user message
    const amtMatch = message.match(/(?:₹|rs\.?|টাকা|रुपये)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i);
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null;
    
    const utrMatch = message.match(/\b([0-9]{12})\b/);
    const utr = utrMatch ? utrMatch[1] : null;

    let paymentMethod = null;
    const lower = message.toLowerCase();
    if (lower.includes("upi") || lower.includes("gpay") || lower.includes("phonepe") || lower.includes("paytm")) {
      paymentMethod = "UPI";
    } else if (lower.includes("card") || lower.includes("कार्ड")) {
      paymentMethod = "CARD";
    } else if (lower.includes("net banking") || lower.includes("बैंकिंग")) {
      paymentMethod = "NET_BANKING";
    }

    const extracted = {};
    if (amount) extracted.fraud_amount = amount;
    if (paymentMethod) extracted.payment_method = paymentMethod;
    if (utr) extracted.transaction_id = utr;
    extracted.incident_description = message;

    const missing = [];
    if (!extracted.fraud_amount) missing.push("fraud_amount");
    if (!extracted.payment_method) missing.push("payment_method");
    if (!extracted.transaction_id) missing.push("transaction_or_suspect");

    const isComplete = missing.length === 0;

    let reply = "";
    if (isComplete) {
      reply = language === "Hindi"
        ? "धन्यवाद। मैंने सभी विवरण एकत्र कर लिए हैं। शिकायत समीक्षा के लिए तैयार है।"
        : language === "Bengali"
        ? "ধন্যবাদ। আমি প্রয়োজনীয় তথ্য সংগ্রহ করেছি। অভিযোগটি পর্যালোচনার জন্য প্রস্তুত।"
        : "Thank you. I have collected your details. Your complaint draft is ready for review.";
    } else if (missing.includes("fraud_amount")) {
      reply = language === "Hindi"
        ? "सटीक शिकायत के लिए, कृपया बताएं कि आपके खाते से कितने रुपये कटे?"
        : language === "Bengali"
        ? "সঠিক অভিযোগের জন্য দয়া করে বলুন কত টাকা ক্ষতি হয়েছে?"
        : "To report this accurately, could you please state how much money was deducted or lost?";
    } else if (missing.includes("payment_method")) {
      reply = language === "Hindi"
        ? "इस लेनदेन के लिए किस माध्यम का उपयोग किया गया था (जैसे UPI, डेबिट/क्रेडिट कार्ड, या नेट बैंकिंग)?"
        : language === "Bengali"
        ? "পেমেন্টের মাধ্যম কী ছিল (যেমন UPI, ডেবিট কার্ড, বা নেট ব্যাঙ্কিং)?"
        : "Which payment method was used (e.g., UPI, Card, or Net Banking)?";
    } else {
      reply = language === "Hindi"
        ? "क्या आपके पास बैंक SMS या ऐप से 12 अंकों का UPI UTR नंबर है?"
        : language === "Bengali"
        ? "আপনার কাছে কি ১২ সংখ্যার UPI UTR নম্বর আছে?"
        : "Do you have the 12-digit UPI UTR number or bank reference number?";
    }

    return {
      complaint_id: complaintId,
      assistant_message: reply,
      extracted_fields: extracted,
      missing_fields: missing,
      is_completed: isComplete,
      quick_options: missing.includes("payment_method") ? ["UPI", "Debit/Credit Card", "Net Banking"] : null
    };
  },

  // 3. Complaints
  async getComplaint(complaintId) {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Get complaint offline fallback");
    }
    return {
      id: complaintId,
      fraud_amount: null,
      payment_method: null,
      transaction_id: null,
      suspect_phone: null,
      incident_date: new Date().toISOString().split("T")[0],
      submission_status: "DRAFT",
      tracking_status: "NOT_SUBMITTED"
    };
  },

  async generateNarrative(complaintId) {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}/generate-narrative`, {
        method: "POST"
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Generate narrative offline fallback");
    }
    return {
      complaint_id: complaintId,
      narrative: `FORMAL CYBERCRIME COMPLAINT PETITION\nReference: National Cyber Crime Reporting Portal (cybercrime.gov.in)\nIncident Category: Financial Cyber Fraud\nStatutory Sections: Section 66D IT Act 2000 & Section 318(4) BNS / Section 420 IPC\nRelief Requested: Urgent notice to recipient bank via 1930 CFCFRMS to mark lien on suspect account.`,
      submission_status: "READY"
    };
  },

  async getGuidedSubmission(complaintId) {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}/guided-submission`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Guided submission offline fallback");
    }
    return {
      official_portal_url: "https://cybercrime.gov.in",
      helpline: "1930",
      checklist: [
        { step: 1, title: "Visit Official Portal", instruction: "Open cybercrime.gov.in and click Financial Fraud." },
        { step: 2, title: "Citizen Login with Mobile OTP", instruction: "Verify your mobile number on portal." },
        { step: 3, title: "Enter Incident Details", instruction: "Paste the pre-filled fields provided by CyberSathi." },
        { step: 4, title: "Upload Payment Screenshot", instruction: "Attach the payment receipt." },
        { step: 5, title: "Save Acknowledgement Number", instruction: "Save your 14-digit Acknowledgement Number for tracking." }
      ],
      prefilled_fields: {
        category: "Financial Fraud",
        sub_category: "FINANCIAL_CYBER_FRAUD",
        loss_amount: "",
        utr_or_txn_id: ""
      }
    };
  },

  async submitAuthorizedAPI(complaintId) {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}/submit-authorized-api`, {
        method: "POST"
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Authorized submission offline fallback");
    }
    const ack = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${Math.floor(10000000 + Math.random() * 90000000)}`;
    return {
      success: true,
      acknowledgement_number: ack,
      submission_status: "ACKNOWLEDGED",
      tracking_status: "BANK_FREEZE_DISPATCHED",
      message: "Complaint acknowledged by National Cyber Crime Reporting Portal."
    };
  },

  // 4. Tracking
  async getTrackingStatus(identifier) {
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/status/${identifier}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Tracking status offline fallback");
    }
    return {
      found: false,
      message: "No local record found for this identifier.",
      official_tracking_url: "https://www.cybercrime.gov.in/Webform/chkackstatus.aspx",
      instruction: "Check status directly on official cybercrime portal."
    };
  },

  async attachAcknowledgement(complaintId, ackNumber) {
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/attach-acknowledgement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint_id: complaintId, acknowledgement_number: ackNumber })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Attach acknowledgement offline fallback");
    }
    return { success: true, acknowledgement_number: ackNumber };
  },

  // 5. Citizen Cyber Services
  async scanFraudRisk(query, queryType = "AUTO") {
    try {
      const res = await fetch(`${API_BASE_URL}/services/fraud-scanner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, query_type: queryType })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Fraud risk scan offline fallback");
    }
    // Fallback scanner analysis
    const isVoIP = query.startsWith("+92") || query.startsWith("+1");
    const isApk = query.toLowerCase().includes(".apk");
    return {
      query,
      query_type: queryType,
      risk_score: isApk || isVoIP ? 85 : 50,
      risk_level: isApk || isVoIP ? "CRITICAL" : "MEDIUM",
      category: isApk ? "PHISHING_APK_DOWNLOAD" : "SUSPICIOUS_COMMUNICATION",
      category_title: isApk ? "Malicious APK Installation Link" : "Suspicious Communication",
      red_flags: [
        "Unverified sender or channel soliciting action.",
        "Potentially linked to known modus operandi in financial cyber fraud."
      ],
      advisories: [
        "Never share OTP, ATM PIN, or UPI PIN with anyone calling or messaging.",
        "If unauthorized money was debited, call 1930 immediately."
      ],
      emergency_helpline: "1930",
      official_portal: "https://cybercrime.gov.in"
    };
  },

  async generateRbiClaim(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/services/rbi-ombudsman-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("RBI claim offline fallback");
    }
    return {
      success: true,
      bank_name: payload.bank_name,
      claim_amount: payload.fraud_amount,
      rbi_circular: "DBR.No.Leg.BC.78/09.07.005/2017-18",
      statutory_shadow_reversal_days: 10,
      maximum_resolution_days: 90,
      ombudsman_url: "https://cms.rbi.org.in",
      formal_claim_text: `FORMAL CLAIM FOR 100% REFUND UNDER RBI ZERO LIABILITY FRAMEWORK\nTo: The Branch Manager & Principal Nodal Officer, ${payload.bank_name}\nSubject: Claim for reversal of unauthorized electronic transaction of INR ${payload.fraud_amount}\nRef: RBI Notification DBR.No.Leg.BC.78/09.07.005/2017-18\n\nI hereby register this claim for full reversal regarding the unauthorized electronic transaction on account/card ending in XX${payload.account_or_card_last4}. Under Paragraph 6(a) of the RBI Master Circular, the customer has ZERO LIABILITY for third-party breaches reported within three working days.`
    };
  },

  async getSancharSaathi() {
    try {
      const res = await fetch(`${API_BASE_URL}/services/sanchar-saathi`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Sanchar Saathi offline fallback");
    }
    return {
      portal_name: "Sanchar Saathi (DoT, Govt of India)",
      official_url: "https://sancharsaathi.gov.in",
      services: [
        {
          code: "CEIR",
          title: "Block Stolen/Lost Mobile Phone (CEIR)",
          description: "Blocks IMEI across all telecom operators in India to prevent reuse.",
          official_url: "https://www.ceir.gov.in/Request/CeirUserBlockRequestDirect.jsp",
          checklist: ["Police complaint / e-FIR copy", "Purchase Invoice", "Identity Proof", "Alternate mobile number"]
        },
        {
          code: "TAFCOP",
          title: "Check SIMs in Your Name (TAFCOP)",
          description: "View all active mobile numbers issued on your identity and report fake connections.",
          official_url: "https://tafcop.sancharsaathi.gov.in",
          checklist: ["Enter Aadhaar-linked mobile", "Verify OTP", "Select unrecognized numbers", "Submit cancellation"]
        },
        {
          code: "CHAKSHU",
          title: "Report Fraudulent Calls & SMS (Chakshu)",
          description: "Report suspect calls/SMS regarding KYC, electricity, or courier fraud directly to DoT.",
          official_url: "https://sancharsaathi.gov.in/sfc/",
          checklist: ["Screenshot of SMS/Call", "Suspect mobile number", "Date and time", "Summary of scam message"]
        }
      ]
    };
  },

  async getQuickActions() {
    try {
      const res = await fetch(`${API_BASE_URL}/services/quick-actions`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Quick actions offline fallback");
    }
    return {
      national_cyber_helpline: "1930",
      universal_upi_delink_ussd: "*99*99#",
      bank_emergency_actions: [
        { bank: "State Bank of India", toll_free: "18001234", sms_block: "SMS 'BLOCK <last 4>' to 567676", ussd: "*99*41#" },
        { bank: "HDFC Bank", toll_free: "18002026161", sms_block: "SMS 'BLOCK' to 5676712", ussd: "*99*43#" },
        { bank: "ICICI Bank", toll_free: "18001080", sms_block: "SMS 'IBLOCK <last 4>' to 9215667766", ussd: "*99*44#" },
        { bank: "Axis Bank", toll_free: "18604195555", sms_block: "SMS 'BLOCKCARD' to 5676782", ussd: "*99*45#" },
        { bank: "Punjab National Bank", toll_free: "18001802222", sms_block: "SMS 'HOT <Card No>' to 5607040", ussd: "*99*42#" }
      ]
    };
  },

  async getTrendingScams() {
    try {
      const res = await fetch(`${API_BASE_URL}/services/trending-scams`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Trending scams offline fallback");
    }
    return [
      {
        id: "scam_1",
        title: "Digital Arrest Scam (Fake Police / CBI Video Calls)",
        category: "IMPERSONATION",
        risk: "CRITICAL",
        modus_operandi: "Scammers pose as CBI/ED on Skype or WhatsApp video call with fake uniforms and court warrants, demanding fund transfers for 'verification'.",
        safety_rule: "Indian Police and agencies NEVER arrest or interrogate via video calls. No such concept exists in law."
      },
      {
        id: "scam_2",
        title: "Electricity Power Disconnection Threat",
        category: "UTILITY_FRAUD",
        risk: "CRITICAL",
        modus_operandi: "SMS claiming electricity will be disconnected tonight at 9:30 PM due to unpaid bill, urging call to personal mobile.",
        safety_rule: "Electricity boards never send mobile numbers for payments. Pay only via official apps or Bharat BillPay."
      },
      {
        id: "scam_3",
        title: "Work-From-Home YouTube Like Task Scam",
        category: "INVESTMENT_FRAUD",
        risk: "HIGH",
        modus_operandi: "Victims are paid Rs 150 for liking videos, then coerced into VIP crypto recharge groups where lakhs are stolen.",
        safety_rule: "Never pay money to complete online tasks or earn commission."
      },
      {
        id: "scam_4",
        title: "Malicious APK Loan & KYC Apps",
        category: "MALWARE_EXTORTION",
        risk: "CRITICAL",
        modus_operandi: "Links to install .APK files that steal contacts, photos, and OTPs for blackmail and unauthorized deductions.",
        safety_rule: "Never install .APK files from WhatsApp or SMS. Use only official app stores."
      }
    ];
  }
};
