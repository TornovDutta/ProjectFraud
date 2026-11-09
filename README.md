# 🛡️ CyberSathi (साइबर साथी / সাইবার সাথী)
### AI-Powered Voice-Based Cyber Fraud Complaint Assistant for Indian Citizens

> **Civic Technology for Bharat**: Bridging the digital divide by enabling vulnerable citizens—who struggle with typing, complex bureaucratic jargon, or navigating government portals—to report financial cyber fraud through natural voice in **Hindi (हिन्दी)**, **Bengali (বাংলা)**, and **English**, draft legally robust complaints, and track recovery through the **National Cyber Crime Reporting Portal** and the **1930 Helpline (CFCFRMS)**.

---

## 📌 Executive Architecture & Approach

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CITIZEN VOICE INTERACTION LAYER                       │
│  • Voice Input (Hindi / Bengali / English)  • Text-to-Speech Feedback  │
│  • Emergency 1930 & Golden Hour Banner      • OCR Screenshot Analysis  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 FASTAPI INTELLIGENT BACKEND SERVICES                   │
│  • Speech Transcription (Whisper / Native Web Speech API)              │
│  • AI Structured Extractor (Amount, Payment Mode, UTR, Suspect Phone) │
│  • Security Sanitizer: Real-time PIN / OTP / Password Redaction        │
│  • State-Machine Dialogue Manager: Dynamic missing field prompts       │
│  • Legal Petition Generator (IT Act 2000 Section 66D, IPC 420/BNS 318) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────┴────────────────────────────────────┐
│                    MONGODB PERSISTENCE LAYER                           │
│  • users: Profiles & Preferred Language                                │
│  • complaints: Structured Fraud Records, Amounts, Audit Trail          │
│  • conversations: Message Transcripts & State Transition Log           │
│  • evidences: Uploaded Screenshots, Receipts & Extracted OCR Metadata  │
│  • complaint_updates: Chronological Milestones & Bank Action Logs      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   GOVERNMENT PORTAL HANDOFF LAYER                      │
│                                                                        │
│  [State 1: DRAFTED]                                                    │
│    Verified by citizen, complete audit trail, legal petition created   │
│                                                                        │
│  [State 2: SUBMITTED TO GOVERNMENT]                                    │
│    • Mode A (Standard MVP): Guided manual submission on cybercrime.gov │
│      with 1-click prefilled clipboard packet & citizen OTP             │
│    • Mode B (Authorized): Direct API submission via national gateway   │
│                                                                        │
│  [State 3: OFFICIALLY ACKNOWLEDGED]                                    │
│    14-digit Acknowledgement Number linked (e.g., 20261142398936)       │
│    Real-time tracking of 1930 inter-bank CFCFRMS freeze / lien alerts  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Innovations

1. **Voice-First & Multilingual Intelligence**
   - Natural spoken input in **Hindi**, **Bengali**, and **English**.
   - Handles colloquial speech (e.g., *"मेरे 15000 रुपये कट गए कल दोपहर 2 बजे"* or *"ব্যাঙ্ক কর্মী সেজে ফোন করেছিল, UPI দিয়ে ১৫,০০০ টাকা কেটে নিয়েছে"*).
   - Audio synthesized replies in the chosen language.

2. **Intelligent Structured Information Extraction**
   - Avoids hallucination-prone unstructured chatbots.
   - Extracts: `fraud_amount`, `payment_method` (UPI, Cards, NetBanking), `transaction_id` (12-digit UTR), `incident_date`, `incident_time`, `suspect_phone`, `suspect_upi_id`.
   - Validates missing fields and asks targeted, empathetic follow-up questions with quick-reply chips.

3. **Active Fraud Emergency Protocol (1930 & Golden Hour)**
   - When recent financial fraud is detected (< 2-24 hours), the app surfaces the **1930 Helpline** and bank-specific freeze numbers before requiring form completion.
   - Triggers the **Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS)** mechanism to notify beneficiary banks to freeze stolen funds in transit.

4. **Zero-Trust Security & Automatic Redaction**
   - **Anti-PIN Guarantee**: CyberSathi explicitly warns users: *"CyberSathi will NEVER ask for your UPI PIN, ATM PIN, or OTP."*
   - Built-in regex security sanitizer automatically masks and redacts any accidentally typed or spoken PIN or OTP into `[REDACTED_SECURITY_DATA]`.

5. **AI Evidence Analysis (Receipt OCR)**
   - Upload UPI payment screenshots or bank debit SMS.
   - Automatically parses UTR reference numbers, beneficiary VPA, and amounts to eliminate human entry errors.

6. **Clear Distinction of Three Complaint States**:
   - `DRAFT`: AI conversation underway, details being verified.
   - `READY / SUBMITTED`: Approved by citizen, submitted on official portal.
   - `ACKNOWLEDGED`: Issued an official 14-digit government Acknowledgement Number (`202611...`) with live tracking.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Mobile App** | React Native + Expo (SDK 58) | Cross-platform (Android, iOS, Web), Vector Icons, Responsive UI |
| **Backend API** | Python FastAPI + Uvicorn | High-throughput asynchronous RESTful API & AI pipeline |
| **Database** | MongoDB (Motor async driver) | Document storage with resilient fallback mode |
| **Speech & AI** | Whisper / Web Speech API + State Engine | Multilingual STT, TTS, and structured information extraction |
| **Security** | JWT (PyJWT), Passlib (Bcrypt), Regex Redaction | Token authentication and sensitive data protection |
| **Verification & Testing**| Pytest, Postman Collection | Comprehensive unit tests, end-to-end API coverage |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) MongoDB running locally or MongoDB Atlas connection URI

### 2. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Configure environment variables
# Copy .env.example to .env and adjust MONGODB_URL if needed
copy .env.example .env

# Run FastAPI backend server
python run.py
```
> The API server will be live at `http://127.0.0.1:8000`  
> Interactive Swagger API Documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup (React Native + Expo)

```powershell
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Expo application
npm run web
# Or for mobile:
# npm run android  /  npm run ios
```
> The web interface opens at `http://localhost:8081`  
> You can also scan the QR code using the **Expo Go** app on your Android or iOS device!

---

## 🧪 Testing & Verification

### Run Unit & Integration Tests (11 tests passed)
```powershell
.\backend_venv\Scripts\pytest -v
```

### Run End-to-End Demo Runner Script
Demonstrates citizen voice input, Hindi/English extraction, PIN sanitization, receipt OCR, legal narrative generation, government handoff, and tracking:
```powershell
.\backend_venv\Scripts\python demo_runner.py
```

### Postman API Collection
The ready-to-import Postman collection is located at:
`postman/CyberSathi.postman_collection.json`

It includes pre-configured requests for:
1. Emergency Helpline & Bank Fraud Desks (`GET /api/v1/emergency/helpline-info`)
2. Start AI Voice Conversation (`POST /api/v1/chat/start`)
3. Send Utterance & Structured Extraction (`POST /api/v1/chat/message`)
4. Generate Formal Legal Complaint Narrative (`POST /api/v1/complaints/{id}/generate-narrative`)
5. Guided Submission Checklist Packet (`GET /api/v1/complaints/{id}/guided-submission`)
6. Authorized API Submission Simulation (`POST /api/v1/complaints/{id}/submit-authorized-api`)
7. Complaint Status Tracking (`GET /api/v1/tracking/status/{ack}`)

---

## 📂 Project Directory Structure

```
projectFrud/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py              # User authentication & JWT
│   │   │   ├── chat.py              # AI conversational assistant endpoints
│   │   │   ├── complaints.py        # Complaint CRUD & narrative generation
│   │   │   ├── evidence.py          # Evidence upload & OCR analysis
│   │   │   ├── tracking.py          # Acknowledgement & status tracking
│   │   │   └── emergency.py         # 1930 Helpline & bank desk registry
│   │   ├── core/
│   │   │   ├── config.py            # Environment settings & config
│   │   │   ├── database.py          # Async MongoDB (Motor) with resilient fallback
│   │   │   └── security.py          # PIN/OTP sanitization & JWT
│   │   ├── models/
│   │   │   ├── complaint.py         # Complaint schemas & enum states
│   │   │   ├── conversation.py      # Chat turn & message schemas
│   │   │   ├── evidence.py          # Evidence metadata & OCR schema
│   │   │   ├── user.py              # Citizen user schema
│   │   │   └── update.py            # Status timeline update events
│   │   ├── services/
│   │   │   ├── ai_extractor.py      # Multilingual extraction (En, Hi, Bn)
│   │   │   ├── conversation_flow.py # State machine & follow-up generator
│   │   │   ├── formal_complaint_gen.py # IT Act 66D legal petition generator
│   │   │   ├── ocr_service.py       # Payment receipt & screenshot analyzer
│   │   │   └── portal_handoff.py    # Guided checklist & API simulation
│   │   └── main.py                  # FastAPI app entry point & CORS
│   ├── tests/
│   │   ├── test_api_endpoints.py    # FastAPI endpoint integration tests
│   │   ├── test_complaints.py       # Legal petition & handoff tests
│   │   └── test_extraction.py       # Multilingual NLP & security tests
│   ├── run.py                       # Server runner
│   ├── requirements.txt             # Python dependencies
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Emergency1930Banner.js   # Prominent 1930 call & freeze banner
│   │   │   ├── ExtractionSummaryCard.js # Live progress & extracted chips
│   │   │   ├── LanguageSelector.js      # English / हिन्दी / বাংলা selector
│   │   │   └── VoiceRecorder.js         # Animated microphone recording button
│   │   ├── screens/
│   │   │   ├── HomeScreen.js            # Main dashboard & scam alerts
│   │   │   ├── VoiceAssistantScreen.js  # Conversational voice AI interface
│   │   │   ├── ReviewComplaintScreen.js # Editable fields & legal narrative preview
│   │   │   ├── EvidenceUploadScreen.js  # Receipt upload & OCR analysis
│   │   │   ├── GovernmentHandoffScreen.js # Guided vs API submission & ack link
│   │   │   ├── TrackingScreen.js        # Timeline milestones & official link
│   │   │   └── EmergencyScreen.js       # Golden hour protocol & bank helplines
│   │   └── services/
│   │       ├── api.js                   # Client HTTP API connector
│   │       ├── audio.js                 # Cross-platform TTS & Speech-to-Text
│   │       └── i18n.js                  # Complete En, Hi, Bn translations
│   ├── App.js                           # App router & persistent navigation
│   ├── package.json
│   └── app.json
├── postman/
│   └── CyberSathi.postman_collection.json # Exported Postman collection
├── demo_runner.py                       # Interactive CLI demonstration
├── pytest.ini
└── README.md
```

---

## ⚖️ Statutory Framework Referenced
Complaints prepared by CyberSathi invoke appropriate statutory provisions:
- **Section 66C, Information Technology Act 2000**: Identity Theft.
- **Section 66D, Information Technology Act 2000**: Cheating by personation by using computer resource.
- **Section 318(4), Bharatiya Nyaya Sanhita (BNS 2023) / Section 420 IPC**: Cheating and dishonestly inducing delivery of property.
- **Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS)**: Golden-hour inter-bank freezing mechanism.
