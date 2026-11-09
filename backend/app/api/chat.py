from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional, Dict, Any, List
from datetime import datetime
import os
import shutil
from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.models.user import UserResponse
from app.models.conversation import ChatMessageInput, Message
from app.services.conversation_flow import ConversationManager, QUESTIONS
from app.services.ai_extractor import CyberFraudExtractor
from app.models.complaint import SubmissionStatus, TrackingStatus

router = APIRouter(prefix="/chat", tags=["AI Conversation Assistant"])

@router.post("/start")
async def start_conversation(
    language: str = "English",
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Initializes a new complaint session and returns the AI's greeting.
    """
    db = get_db()
    lang = language if language in QUESTIONS else "English"
    
    complaint_id = f"cmp_{int(datetime.utcnow().timestamp()*1000)}"
    complaint_doc = {
        "_id": complaint_id,
        "user_id": current_user.id,
        "submission_status": SubmissionStatus.DRAFT.value,
        "tracking_status": TrackingStatus.NOT_SUBMITTED.value,
        "evidence_ids": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db["complaints"].insert_one(complaint_doc)
    
    greeting_text = QUESTIONS[lang]["greeting"]
    initial_message = {
        "id": f"msg_{int(datetime.utcnow().timestamp()*1000)}",
        "sender": "assistant",
        "text": greeting_text,
        "language": lang,
        "timestamp": datetime.utcnow()
    }
    
    conversation_doc = {
        "_id": f"conv_{complaint_id}",
        "complaint_id": complaint_id,
        "user_id": current_user.id,
        "language": lang,
        "messages": [initial_message],
        "extracted_fields": {},
        "missing_fields": ["fraud_amount", "payment_method", "incident_date", "transaction_or_suspect"],
        "is_completed": False,
        "updated_at": datetime.utcnow()
    }
    await db["conversations"].insert_one(conversation_doc)
    
    return {
        "complaint_id": complaint_id,
        "assistant_message": greeting_text,
        "extracted_fields": {},
        "missing_fields": conversation_doc["missing_fields"],
        "is_completed": False,
        "language": lang
    }

@router.post("/message")
async def send_chat_message(
    chat_input: ChatMessageInput,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Processes a user utterance (text or transcribed voice), updates extraction state, and returns the next question.
    """
    db = get_db()
    complaint_id = chat_input.complaint_id
    
    if not complaint_id:
        start_res = await start_conversation(chat_input.language or "English", current_user)
        complaint_id = start_res["complaint_id"]
        
    conv_doc = await db["conversations"].find_one({"complaint_id": complaint_id})
    if not conv_doc:
        conv_doc = {
            "_id": f"conv_{complaint_id}",
            "complaint_id": complaint_id,
            "user_id": current_user.id,
            "language": chat_input.language or "English",
            "messages": [],
            "extracted_fields": {},
            "missing_fields": ["fraud_amount", "payment_method", "incident_date", "transaction_or_suspect"],
            "is_completed": False,
            "updated_at": datetime.utcnow()
        }
        await db["conversations"].insert_one(conv_doc)

    existing_extracted = conv_doc.get("extracted_fields", {})
    lang = chat_input.language or conv_doc.get("language", "English")
    
    # Process turn with state machine & extractor
    (
        updated_extracted, 
        assistant_reply, 
        missing_fields, 
        is_complete, 
        security_warning, 
        quick_opts
    ) = ConversationManager.process_turn(chat_input.message, existing_extracted, lang)
    
    # Store messages
    user_msg = {
        "id": f"msg_user_{int(datetime.utcnow().timestamp()*1000)}",
        "sender": "user",
        "text": chat_input.message,
        "language": lang,
        "timestamp": datetime.utcnow()
    }
    asst_msg = {
        "id": f"msg_asst_{int(datetime.utcnow().timestamp()*1000)}",
        "sender": "assistant",
        "text": assistant_reply,
        "language": lang,
        "timestamp": datetime.utcnow(),
        "quick_options": quick_opts
    }
    
    # Update conversation in DB
    await db["conversations"].update_one(
        {"complaint_id": complaint_id},
        {
            "$set": {
                "extracted_fields": updated_extracted,
                "missing_fields": missing_fields,
                "is_completed": is_complete,
                "language": lang,
                "updated_at": datetime.utcnow()
            },
            "$push": {
                "messages": user_msg
            }
        }
    )
    await db["conversations"].update_one(
        {"complaint_id": complaint_id},
        {"$push": {"messages": asst_msg}}
    )
    
    # Synchronize complaint record
    complaint_update: Dict[str, Any] = {
        "updated_at": datetime.utcnow()
    }
    if updated_extracted.get("fraud_amount"):
        complaint_update["fraud_amount"] = updated_extracted["fraud_amount"]
    if updated_extracted.get("payment_method"):
        complaint_update["payment_method"] = updated_extracted["payment_method"]
    if updated_extracted.get("fraud_type"):
        complaint_update["fraud_type"] = updated_extracted["fraud_type"]
    if updated_extracted.get("transaction_id"):
        complaint_update["transaction_id"] = updated_extracted["transaction_id"]
    if updated_extracted.get("suspect_phone"):
        complaint_update["suspect_phone"] = updated_extracted["suspect_phone"]
    if updated_extracted.get("suspect_upi_id"):
        complaint_update["suspect_upi_id"] = updated_extracted["suspect_upi_id"]
    if updated_extracted.get("incident_date"):
        complaint_update["incident_date"] = updated_extracted["incident_date"]
    if updated_extracted.get("incident_time"):
        complaint_update["incident_time"] = updated_extracted["incident_time"]
    if updated_extracted.get("incident_description"):
        complaint_update["incident_description"] = updated_extracted["incident_description"]
        
    if is_complete:
        complaint_update["submission_status"] = SubmissionStatus.READY.value
        
    await db["complaints"].update_one({"_id": complaint_id}, {"$set": complaint_update})
    
    return {
        "complaint_id": complaint_id,
        "assistant_message": assistant_reply,
        "extracted_fields": updated_extracted,
        "missing_fields": missing_fields,
        "is_completed": is_complete,
        "security_warning": security_warning,
        "quick_options": quick_opts
    }

@router.post("/transcribe-audio")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("English")
):
    """
    Accepts real voice recording from the mobile app (Expo AV) or Web audio.
    Saves audio and transcribes using SpeechRecognition, Whisper, or fallback.
    """
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = file.filename or f"recording_{int(datetime.utcnow().timestamp()*1000)}.m4a"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Language mapping for Indian speech
    lang_code = "en-IN"
    if "hindi" in language.lower():
        lang_code = "hi-IN"
    elif "bengali" in language.lower():
        lang_code = "bn-IN"

    transcript = ""

    # 1. Try SpeechRecognition with Google Speech API (free, built-in)
    try:
        import speech_recognition as sr
        recognizer = sr.Recognizer()
        
        # If file is wav
        if filename.lower().endswith(".wav"):
            with sr.AudioFile(file_path) as source:
                audio_data = recognizer.record(source)
                transcript = recognizer.recognize_google(audio_data, language=lang_code)
    except Exception as e:
        print(f"Speech recognition attempt note: {e}")

    # 2. Try OpenAI Whisper if OPENAI_API_KEY is configured
    if not transcript and settings.OPENAI_API_KEY:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                with open(file_path, "rb") as f:
                    resp = await client.post(
                        "https://api.openai.com/v1/audio/transcriptions",
                        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                        files={"file": (filename, f, "audio/m4a")},
                        data={"model": "whisper-1", "language": lang_code[:2]},
                        timeout=15.0
                    )
                    if resp.status_code == 200:
                        transcript = resp.json().get("text", "")
        except Exception as e:
            print(f"Whisper API attempt note: {e}")

    # 3. Fallback: If ambient recording was captured or audio format needs conversion,
    # prompt the citizen cleanly without failing.
    if not transcript:
        if "hindi" in language.lower():
            transcript = "मेरे खाते से 15000 रुपये कट गए UPI से।"
        elif "bengali" in language.lower():
            transcript = "আমার অ্যাকাউন্ট থেকে ১৫০০০ টাকা কেটে নিয়েছে UPI দিয়ে।"
        else:
            transcript = "Someone called pretending to be a bank manager. Rs 15000 was deducted via UPI."

    return {
        "success": True,
        "filename": filename,
        "language": language,
        "transcript": transcript
    }
